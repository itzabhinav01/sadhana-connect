import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileQueryKeys, useAuth } from '@sadhana-connect/auth'
import { supabaseProfileRepository } from '@sadhana-connect/infra-supabase'

export interface UpdateProfileParams {
  fullName: string
  phoneNumber?: string | null
}

export function useUpdateProfile() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (params: UpdateProfileParams) => {
      if (!userId) {
        throw new Error('useUpdateProfile: no authenticated user')
      }
      return supabaseProfileRepository.updateProfile(userId, params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail(userId) })
    },
  })
}
