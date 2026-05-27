import { supabase } from '@/lib/supabase/client'
import type { Database, LeaveRequestStatus, LeaveRequestWithEmployee } from '@/lib/supabase/types'

type InsertRow = Database['public']['Tables']['leave_requests']['Insert']
type UpdateRow = Database['public']['Tables']['leave_requests']['Update']

export async function fetchLeaveRequests(
  status?: LeaveRequestStatus | 'all'
): Promise<LeaveRequestWithEmployee[]> {
  let query = supabase
    .from('leave_requests')
    .select(
      `
      *,
      employee:profiles!leave_requests_employee_id_fkey ( id, full_name, role, created_at ),
      decider:profiles!leave_requests_decided_by_fkey ( id, full_name, role, created_at )
    `
    )
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as LeaveRequestWithEmployee[]
}

export async function fetchApprovedLeaveRequests(): Promise<LeaveRequestWithEmployee[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(
      `
      *,
      employee:profiles!leave_requests_employee_id_fkey ( id, full_name, role, created_at ),
      decider:profiles!leave_requests_decided_by_fkey ( id, full_name, role, created_at )
    `
    )
    .eq('status', 'approved')
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as LeaveRequestWithEmployee[]
}

export async function createLeaveRequest(values: {
  employee_id: string
  start_date: string
  end_date: string
  reason: string
}): Promise<{ id: string }> {
  const insertData: InsertRow = {
    employee_id: values.employee_id,
    start_date: values.start_date,
    end_date: values.end_date,
    reason: values.reason,
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert(insertData)
    .select('id')
    .single()

  if (error) throw error
  return data as { id: string }
}

export async function updateLeaveRequestStatus(
  id: string,
  status: 'approved' | 'rejected',
  decided_by: string
): Promise<void> {
  const updateData: UpdateRow = {
    status,
    decided_by,
    decided_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('leave_requests').update(updateData).eq('id', id)

  if (error) throw error
}
