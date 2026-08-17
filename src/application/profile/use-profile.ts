import { useQuery } from '@tanstack/react-query'

import { profileQueryKeys } from '@/application/profile/profile-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseProfileRepository } from '@/infrastructure/supabase/profile-repository'

// UX/navigation data only. Every table this profile's role/is_active
// might gate is independently enforced by RLS — this hook never doubles
// as an authorization check on its own.
export function useProfile() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: profileQueryKeys.detail(userId),
    queryFn: () => {
      if (!userId) {
        throw new Error('useProfile: no authenticated user')
      }
      return supabaseProfileRepository.getProfile(userId)
    },
    enabled: userId !== null,
  })
}
