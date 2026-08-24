import { useMutation } from '@tanstack/react-query'

import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase/auth-repository'

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (newPassword: string) =>
      supabaseAuthRepository.updatePassword(newPassword),
  })
}
