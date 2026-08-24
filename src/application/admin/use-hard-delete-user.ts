import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAdminAccountActionsRepository } from '@sadhana-connect/infra-supabase/admin-account-actions-repository'

// Phase 20C — true hard delete, approved reversal of the Phase 5/14
// anonymize-and-preserve design. A single trusted Edge Function call
// (admin-account-actions' hard_delete) does both steps atomically from
// this hook's perspective: permanently deletes the profile (cascading
// sadhana reports, mentor-assignment history on either side, and every
// comment they authored — see migration 0013) and the underlying
// Supabase Auth account. Irreversible; there is no undo and no retry
// affordance for a rare partial failure (see the repository's own doc
// comment) — the profile this admin was looking at is simply gone
// either way.
export function useHardDeleteUser() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: (userId: string) => supabaseAdminAccountActionsRepository.hardDeleteUser(userId),
    // Traced (Phase 20C, same domains as the old anonymize flow): the
    // deleted user's own detail view (now 404s — see the caller's
    // navigate-away), the Users list, the Assignments list/panels, both
    // mentor-devotee-count namespaces, and the dashboard's every count
    // (all of which now reflect a genuinely smaller row set, not a
    // relabeled one). temple_groups is unaffected.
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
