import { useMutation, useQueryClient } from '@tanstack/react-query'

import { profileQueryKeys } from '@/application/profile/profile-query-keys'
import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => supabaseAuthRepository.signOut(),
    onSuccess: () => {
      // Removed, not just invalidated: a signed-out route tree renders
      // nothing profile-dependent, so there is no refetch to serve — the
      // goal is that no stale profile data remains in the cache at all.
      queryClient.removeQueries({ queryKey: profileQueryKeys.all })
    },
  })
}
