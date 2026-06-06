import { toast } from 'sonner'
import type { LeaveType } from '@/lib/supabase/types'

const secret = import.meta.env.VITE_N8N_WEBHOOK_SECRET as string

interface NewRequestPayload {
  employee_name: string
  employee_email: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  request_id: string
}

interface DecisionPayload {
  employee_name: string
  employee_email: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  decided_by: string
  status: 'approved' | 'rejected'
  request_id: string
}

async function postWebhook(url: string, body: object): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secret,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Webhook responded with ${res.status}`)
  }
}

export function notifyNewRequest(payload: NewRequestPayload): void {
  const url = import.meta.env.VITE_N8N_NEW_REQUEST_WEBHOOK as string
  if (!url) return
  postWebhook(url, payload).catch(() => {
    toast.warning('Request saved, but notification could not be sent.')
  })
}

export function notifyDecision(payload: DecisionPayload): void {
  const url = import.meta.env.VITE_N8N_DECISION_WEBHOOK as string
  if (!url) return
  postWebhook(url, payload).catch(() => {
    toast.warning('Decision saved, but notification could not be sent.')
  })
}
