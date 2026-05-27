export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'employee' | 'manager'
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'employee' | 'manager'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'employee' | 'manager'
          created_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
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
