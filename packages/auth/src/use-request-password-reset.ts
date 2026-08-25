import { useMutation } from '@tanstack/react-query'

import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase'

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      supabaseAuthRepository.requestPasswordReset(email),
  })
}
