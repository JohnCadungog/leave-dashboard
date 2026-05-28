export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type LeaveType = 'annual' | 'sick' | 'personal' | 'unpaid' | 'bereavement' | 'other'

export const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'bereavement', label: 'Bereavement Leave' },
  { value: 'other', label: 'Other' },
]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string | null
          role: 'employee' | 'manager'
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email?: string | null
          role?: 'employee' | 'manager'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          role?: 'employee' | 'manager'
          created_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          leave_type: LeaveType
          start_date: string
          end_date: string
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          decided_by: string | null
          decided_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type: LeaveType
          start_date: string
          end_date: string
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          decided_by?: string | null
          decided_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type?: LeaveType
          start_date?: string
          end_date?: string
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          decided_by?: string | null
          decided_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leave_requests_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_decided_by_fkey'
            columns: ['decided_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']

export type LeaveRequestStatus = LeaveRequest['status']

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee: Profile
  decider: Profile | null
}

export function leaveTypeLabel(value: LeaveType): string {
  return LEAVE_TYPES.find((t) => t.value === value)?.label ?? value
}
