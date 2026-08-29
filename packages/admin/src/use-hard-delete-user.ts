import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminAccountActionsRepository } from '@sadhana-connect/infra-supabase'
import { adminQueryKeys } from './admin-query-keys'

export function useHardDeleteUser() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: (userId: string) => supabaseAdminAccountActionsRepository.hardDeleteUser(userId),
    onSuccess: (_result, userId) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.userDetail(adminUserId, userId),
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'assignments', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.mentorDevoteeCounts(adminUserId),
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'mentor-devotee-count', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardSummary(adminUserId),
      })
    },
  })
}
