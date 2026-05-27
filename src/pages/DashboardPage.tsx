import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { toast } from 'sonner'
import { CheckCircle2, PlusCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useLeaveRequests, useDecideLeaveRequest } from '@/hooks/useLeaveRequests'
import type { LeaveRequestStatus, LeaveRequestWithEmployee } from '@/lib/supabase/types'
import { formatDate, formatRelative, countDays, mapSupabaseError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { ErrorFallback } from '@/components/ErrorFallback'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type FilterStatus = LeaveRequestStatus | 'all'

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export function DashboardPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <DashboardContent />
    </ErrorBoundary>
  )
}

function DashboardContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawFilter = searchParams.get('status') as FilterStatus | null
  const filter: FilterStatus = FILTER_OPTIONS.some((o) => o.value === rawFilter)
    ? (rawFilter as FilterStatus)
    : 'all'

  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const isManager = profile?.role === 'manager'

  const {
    data: requests,
    isLoading,
    error,
  } = useLeaveRequests(filter === 'all' ? undefined : filter)
  const decideRequest = useDecideLeaveRequest(profile)

  const [confirmDialog, setConfirmDialog] = useState<{
    request: LeaveRequestWithEmployee
    action: 'approved' | 'rejected'
  } | null>(null)

  const setFilter = (value: FilterStatus) => {
    if (value === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ status: value })
    }
  }

  const handleDecide = async () => {
    if (!confirmDialog || !user) return
    try {
      await decideRequest.mutateAsync({
        id: confirmDialog.request.id,
        status: confirmDialog.action,
        decided_by: user.id,
      })
      toast.success(confirmDialog.action === 'approved' ? 'Request approved.' : 'Request rejected.')
    } catch (err) {
      toast.error(mapSupabaseError(err as { message?: string }))
    } finally {
      setConfirmDialog(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All requests across the team</p>
        </div>
        <Button asChild size="sm">
          <Link to="/new-request">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex gap-2 flex-wrap" role="group" aria-label="Filter by status">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filter === value
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'border-zinc-200 bg-background text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : error ? (
        <div role="alert" className="text-destructive text-sm">
          Failed to load requests. Please refresh.
        </div>
      ) : !requests?.length ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm" aria-label="Leave requests">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Employee
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Dates
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Days
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400 max-w-[200px]"
                >
                  Reason
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Decided by
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  Submitted
                </th>
                {isManager && (
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {requests.map((r) => (
                <tr
                  key={r.id}
                  className="bg-background hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{r.employee.full_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    {formatDate(r.start_date)}
                    {r.start_date !== r.end_date && <> – {formatDate(r.end_date)}</>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {countDays(r.start_date, r.end_date)}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span
                      className="block truncate text-zinc-600 dark:text-zinc-400"
                      title={r.reason}
                    >
                      {r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {r.decider?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-500 text-xs">
                    {formatRelative(r.created_at)}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
                            onClick={() => setConfirmDialog({ request: r, action: 'approved' })}
                            aria-label={`Approve leave request from ${r.employee.full_name}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950"
                            onClick={() => setConfirmDialog({ request: r, action: 'rejected' })}
                            aria-label={`Reject leave request from ${r.employee.full_name}`}
                          >
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(o) => !o && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === 'approved' ? 'Approve' : 'Reject'} leave request?
            </DialogTitle>
            <DialogDescription>
              {confirmDialog && (
                <>
                  {confirmDialog.action === 'approved'
                    ? 'This will approve the leave request for '
                    : 'This will reject the leave request for '}
                  <strong>{confirmDialog.request.employee.full_name}</strong> from{' '}
                  {formatDate(confirmDialog.request.start_date)} to{' '}
                  {formatDate(confirmDialog.request.end_date)}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.action === 'approved' ? 'default' : 'destructive'}
              onClick={handleDecide}
              disabled={decideRequest.isPending}
            >
              {decideRequest.isPending
                ? 'Saving…'
                : confirmDialog?.action === 'approved'
                  ? 'Yes, approve'
                  : 'Yes, reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div
      className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      aria-busy="true"
      aria-label="Loading requests"
    >
      <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3">
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }, (_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <CalendarDaysIcon />
      </div>
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">No leave requests yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests will appear here once employees submit them.
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to="/new-request">Submit first request</Link>
      </Button>
    </div>
  )
}

function CalendarDaysIcon() {
  return (
    <svg
      className="h-6 w-6 text-zinc-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  )
}
