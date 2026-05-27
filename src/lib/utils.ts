import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInCalendarDays, format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy')
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
}

export function countDays(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
}

const PALETTE = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
]

const CALENDAR_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6']

export function employeeColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

export function employeeCalendarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return CALENDAR_PALETTE[hash % CALENDAR_PALETTE.length]
}

export function mapSupabaseError(error: { message?: string } | null): string {
  if (!error?.message) return 'Something went wrong. Please try again.'
  const msg = error.message.toLowerCase()
  if (msg.includes('invalid login credentials')) return 'Invalid email or password.'
  if (msg.includes('email not confirmed')) return 'Please verify your email before signing in.'
  if (msg.includes('already registered')) return 'An account with this email already exists.'
  if (msg.includes('network')) return 'Network error. Check your connection and try again.'
  return 'Something went wrong. Please try again.'
}
