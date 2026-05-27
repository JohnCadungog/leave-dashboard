import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLeaveRequest,
  fetchApprovedLeaveRequests,
  fetchLeaveRequests,
  updateLeaveRequestStatus,
} from '@/lib/queries/leaveRequests'
import type { LeaveRequestStatus, LeaveRequestWithEmployee } from '@/lib/supabase/types'
import { notifyDecision, notifyNewRequest } from '@/lib/webhook'
import type { Profile } from '@/lib/supabase/types'

export function useLeaveRequests(status?: LeaveRequestStatus | 'all') {
  return useQuery<LeaveRequestWithEmployee[], Error>({
    queryKey: ['leave_requests', status ?? 'all'],
    queryFn: () => fetchLeaveRequests(status),
    staleTime: 30 * 1000,
  })
}

export function useApprovedLeaveRequests() {
  return useQuery<LeaveRequestWithEmployee[], Error>({
    queryKey: ['leave_requests', 'approved'],
    queryFn: fetchApprovedLeaveRequests,
    staleTime: 60 * 1000,
  })
}

export function useCreateLeaveRequest(currentUser: Profile | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: {
      employee_id: string
      start_date: string
      end_date: string
      reason: string
    }) => createLeaveRequest(values),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] })
      if (currentUser) {
        notifyNewRequest({
          employee_name: currentUser.full_name,
          employee_email: '',
          start_date: variables.start_date,
          end_date: variables.end_date,
          reason: variables.reason,
          request_id: _data.id,
        })
      }
    },
  })
}

export function useDecideLeaveRequest(currentUser: Profile | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
      decided_by,
    }: {
      id: string
      status: 'approved' | 'rejected'
      decided_by: string
    }) => updateLeaveRequestStatus(id, status, decided_by),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['leave_requests'] })
      const previousData = queryClient.getQueriesData<LeaveRequestWithEmployee[]>({
        queryKey: ['leave_requests'],
      })

      queryClient.setQueriesData<LeaveRequestWithEmployee[]>(
        { queryKey: ['leave_requests'] },
        (old) =>
          old?.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  decided_by: currentUser?.id ?? null,
                  decided_at: new Date().toISOString(),
                  decider: currentUser ?? null,
                }
              : r
          )
      )

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] })
      const cached = queryClient
        .getQueriesData<LeaveRequestWithEmployee[]>({ queryKey: ['leave_requests'] })
        .flatMap(([, d]) => d ?? [])
        .find((r) => r.id === variables.id)

      if (cached && currentUser) {
        notifyDecision({
          employee_name: cached.employee.full_name,
          start_date: cached.start_date,
          end_date: cached.end_date,
          decided_by: currentUser.full_name,
          status: variables.status,
          request_id: variables.id,
        })
      }
    },
  })
}
