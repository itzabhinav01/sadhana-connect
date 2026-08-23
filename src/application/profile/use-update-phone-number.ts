import { useMutation, useQueryClient } from '@tanstack/react-query'

import { profileQueryKeys } from '@/application/profile/profile-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseProfileRepository } from '@/infrastructure/supabase/profile-repository'

// Own-row only — enforced by RLS (profiles_update); no new policy was
// needed since phone_number isn't one of the columns
// protect_profile_restricted_columns gates (role/is_active/
// temple_group_id only).
export function useUpdatePhoneNumber() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (phoneNumber: string) => {
      if (!userId) {
        throw new Error('useUpdatePhoneNumber: no authenticated user')
      }
      return supabaseProfileRepository.updatePhoneNumber(userId, phoneNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail(userId) })
    },
  })
}
