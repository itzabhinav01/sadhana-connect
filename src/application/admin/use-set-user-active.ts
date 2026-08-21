import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAdminUserRepository } from '@/infrastructure/supabase/admin-user-repository'

// Disable/enable — the reversible half of the account lifecycle
// (is_active only, no anonymization). RLS + protect_profile_restricted_columns
// are the real enforcement; this is a single UPDATE under existing grants.
export function useSetUserActive() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      supabaseAdminUserRepository.setUserActive(userId, isActive),
    // Traced (Phase 20): is_active only affects this user's own detail
    // view, the Users list (filterable/displayed by active status), and
    // the dashboard's activeCount/disabledCount figures. It does not
    // touch mentor_assignments rows, temple_groups, or any other admin
    // domain, so those are deliberately left untouched — a stale
    // assignments/temple-groups cache is not created by this mutation.
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.userDetail(adminUserId, variables.userId),
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardSummary(adminUserId),
      })
    },
  })
}
