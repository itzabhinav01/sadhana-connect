import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from './admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminAssignmentRepository } from '@sadhana-connect/infra-supabase'

export function useDeactivateAssignment() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: (assignmentId: string) =>
      supabaseAdminAssignmentRepository.deactivateAssignment(assignmentId),
    // Traced (Phase 20): deactivating one assignment row affects the
    // Assignments list/panels (including AdminUserDetailPage's per-devotee
    // "Current mentor" panel, which shares the same assignments key
    // prefix via useAdminAssignments({devoteeId})), both per-mentor and
    // all-mentor devotee counts, and the dashboard's
    // devoteesWithoutActiveMentor figure. It never touches any profile
    // field, so Users/userDetail/templeGroups are deliberately left
    // untouched.
    onSuccess: () => {
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
