import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAdminAccountActionsRepository } from '@/infrastructure/supabase/admin-account-actions-repository'
import { supabaseAdminUserRepository } from '@/infrastructure/supabase/admin-user-repository'

export type DeleteAndAnonymizeStage = 'profile-anonymized' | 'complete'

export interface DeleteAndAnonymizeResult {
  stage: DeleteAndAnonymizeStage
}

// The approved split architecture: step 1 (DB anonymization + assignment
// deactivation) runs on the normal authenticated client under existing
// RLS; step 2 (Auth ban) runs through the trusted Edge Function — the
// ONLY operation it performs for this workflow. Never
// auth.admin.deleteUser() anywhere in this path.
//
// Both DB statements inside anonymizeUser are idempotent, so if step 1
// partially fails, simply retrying the whole mutation is always safe. If
// step 1 fully succeeds but step 2 (ban) fails, this resolves with stage:
// 'profile-anonymized' rather than throwing — the caller renders the
// explicit "profile anonymized, login ban still pending" state and offers
// a Retry-ban action (useRetryBan below), rather than this ever silently
// reporting complete success.
export function useDeleteAndAnonymizeUser() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: async (userId: string): Promise<DeleteAndAnonymizeResult> => {
      await supabaseAdminUserRepository.anonymizeUser(userId)

      try {
        await supabaseAdminAccountActionsRepository.banUser(userId)
      } catch {
        return { stage: 'profile-anonymized' }
      }

      return { stage: 'complete' }
    },
    // Traced (Phase 20): anonymization changes this user's own profile
    // (is_active, anonymized_at) — affecting their detail view and the
    // Users list — AND deactivates their mentor_assignments rows (see
    // step 1's own doc comment above), affecting the Assignments
    // list/panels and both mentor-devotee-count namespaces, plus the
    // dashboard's active/disabled/anonymized/devoteesWithoutActiveMentor
    // figures. temple_groups is unaffected, so left untouched.
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

// Retries only the ban step, for the partial-failure state above — the DB
// anonymization already succeeded and is not repeated.
export function useRetryBan() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: (userId: string) => supabaseAdminAccountActionsRepository.banUser(userId),
    onSuccess: (_result, userId) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.userDetail(adminUserId, userId),
      })
    },
  })
}
