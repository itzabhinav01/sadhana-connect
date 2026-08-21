import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAdminAssignmentRepository } from '@/infrastructure/supabase/admin-assignment-repository'

// Wraps public.reassign_devotee(uuid, uuid) — handles first-time
// assignment, reassignment, and the same-mentor no-op identically (the DB
// function itself decides which case applies). No client-side branching
// duplicates that logic here.
export function useReassignDevotee() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ devoteeId, mentorId }: { devoteeId: string; mentorId: string }) =>
      supabaseAdminAssignmentRepository.reassignDevotee(devoteeId, mentorId),
    // Traced (Phase 20): reassignment changes mentor_assignments rows
    // (deactivating the old one, creating/reactivating the new one),
    // which affects the Assignments list/panels (including
    // AdminUserDetailPage's per-devotee "Current mentor" panel, same
    // assignments key prefix), both old and new mentor's devotee counts,
    // and the dashboard's devoteesWithoutActiveMentor figure. It never
    // touches any profile field, so Users/userDetail/templeGroups are
    // deliberately left untouched.
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
