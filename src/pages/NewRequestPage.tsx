import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useCreateLeaveRequest } from '@/hooks/useLeaveRequests'
import { leaveRequestSchema, type LeaveRequestValues } from '@/lib/schemas/leaveRequest'
import { mapSupabaseError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ErrorFallback'

const MAX_REASON = 500

export function NewRequestPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NewRequestContent />
    </ErrorBoundary>
  )
}

function NewRequestContent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const createRequest = useCreateLeaveRequest(profile)

  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { start_date: '', end_date: '', reason: '' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const reason = watch('reason') ?? ''
  const startDate = watch('start_date')

  const onSubmit = async (values: LeaveRequestValues) => {
    if (!user) return
    try {
      await createRequest.mutateAsync({
        employee_id: user.id,
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason,
      })
      toast.success('Leave request submitted successfully.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(mapSupabaseError(err as { message?: string }))
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Leave Request</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Submit a leave request for review</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave details</CardTitle>
          <CardDescription>All fields are required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Start date */}
            <div className="space-y-1.5">
              <Label htmlFor="start-date-btn">Start date</Label>
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <Popover open={startOpen} onOpenChange={setStartOpen}>
                    <PopoverTrigger asChild>
                      <button
                        id="start-date-btn"
                        type="button"
                        aria-describedby={errors.start_date ? 'start-date-error' : undefined}
                        data-invalid={errors.start_date ? 'true' : undefined}
                        className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className={field.value ? 'text-foreground' : 'text-muted-foreground'}>
                          {field.value
                            ? format(parseISO(field.value), 'MMM d, yyyy')
                            : 'Pick a date'}
                        </span>
                        <CalendarIcon
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DayPicker
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(day) => {
                          field.onChange(day ? format(day, 'yyyy-MM-dd') : '')
                          setStartOpen(false)
                        }}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.start_date && (
                <p id="start-date-error" role="alert" className="text-xs text-destructive">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            {/* End date */}
            <div className="space-y-1.5">
              <Label htmlFor="end-date-btn">End date</Label>
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <Popover open={endOpen} onOpenChange={setEndOpen}>
                    <PopoverTrigger asChild>
                      <button
                        id="end-date-btn"
                        type="button"
                        aria-describedby={errors.end_date ? 'end-date-error' : undefined}
                        data-invalid={errors.end_date ? 'true' : undefined}
                        className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className={field.value ? 'text-foreground' : 'text-muted-foreground'}>
                          {field.value
                            ? format(parseISO(field.value), 'MMM d, yyyy')
                            : 'Pick a date'}
                        </span>
                        <CalendarIcon
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DayPicker
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(day) => {
                          field.onChange(day ? format(day, 'yyyy-MM-dd') : '')
                          setEndOpen(false)
                        }}
                        disabled={
                          startDate ? { before: parseISO(startDate) } : { before: new Date() }
                        }
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.end_date && (
                <p id="end-date-error" role="alert" className="text-xs text-destructive">
                  {errors.end_date.message}
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="reason"
                    placeholder="Briefly describe the reason for your leave…"
                    rows={4}
                    aria-describedby={errors.reason ? 'reason-error' : 'reason-count'}
                    aria-invalid={!!errors.reason}
                    maxLength={MAX_REASON}
                    {...field}
                  />
                )}
              />
              <div className="flex justify-between">
                {errors.reason ? (
                  <p id="reason-error" role="alert" className="text-xs text-destructive">
                    {errors.reason.message}
                  </p>
                ) : (
                  <span />
                )}
                <p
                  id="reason-count"
                  aria-live="polite"
                  aria-atomic="true"
                  className={`text-xs ${reason.length > MAX_REASON - 20 ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {reason.length}/{MAX_REASON}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || createRequest.isPending}
              >
                {isSubmitting || createRequest.isPending ? 'Submitting…' : 'Submit request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
