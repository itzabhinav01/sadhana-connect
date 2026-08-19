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
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.userDetail(adminUserId, variables.userId),
      })
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all })
    },
  })
}
