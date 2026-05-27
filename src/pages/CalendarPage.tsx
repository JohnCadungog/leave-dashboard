import React, { useMemo, useCallback, useState } from 'react'
import { Calendar, dateFnsLocalizer, type Event, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ErrorFallback'
import { useApprovedLeaveRequests } from '@/hooks/useLeaveRequests'
import { employeeCalendarColor, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { LeaveRequestWithEmployee } from '@/lib/supabase/types'

const locales = { 'en-US': enUS }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
})

interface CalendarEvent extends Event {
  resource: LeaveRequestWithEmployee
  color: string
}

export function CalendarPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CalendarContent />
    </ErrorBoundary>
  )
}

function CalendarContent() {
  const { data: requests, isLoading } = useApprovedLeaveRequests()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<View>('month')

  const events = useMemo<CalendarEvent[]>(() => {
    if (!requests) return []
    return requests.map((r) => ({
      title: r.employee.full_name,
      start: parseISO(r.start_date),
      end: parseISO(r.end_date),
      allDay: true,
      resource: r,
      color: employeeCalendarColor(r.employee_id),
    }))
  }, [requests])

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        border: 'none',
        color: '#fff',
        fontSize: '0.75rem',
        fontWeight: 500,
      },
    }),
    []
  )

  const handleSelectEvent = useCallback((event: object) => {
    setSelectedEvent(event as CalendarEvent)
  }, [])

  const legend = useMemo(() => {
    if (!requests) return []
    const seen = new Set<string>()
    return requests
      .filter((r) => {
        if (seen.has(r.employee_id)) return false
        seen.add(r.employee_id)
        return true
      })
      .map((r) => ({ name: r.employee.full_name, color: employeeCalendarColor(r.employee_id) }))
  }, [requests])

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Leave Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Approved leaves across the team</p>
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Approved leaves across the team</p>
        </div>
        {legend.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Employee legend">
            {legend.map(({ name, color }) => (
              <span
                key={name}
                className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="h-[650px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          views={['month', 'week', 'agenda']}
          eventPropGetter={eventStyleGetter as (event: object) => { style: React.CSSProperties }}
          onSelectEvent={handleSelectEvent}
          popup
        />
      </div>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}

function EventDetailModal({
  event,
  onClose,
}: {
  event: CalendarEvent | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div
            className="mb-1 h-1 w-8 rounded-full"
            style={{ backgroundColor: event?.color }}
            aria-hidden="true"
          />
          <DialogTitle>{event?.resource.employee.full_name}</DialogTitle>
        </DialogHeader>
        {event && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {formatDate(event.resource.start_date)}
              {event.resource.start_date !== event.resource.end_date &&
                ` – ${formatDate(event.resource.end_date)}`}
            </p>
            <p className="text-sm">{event.resource.reason}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
