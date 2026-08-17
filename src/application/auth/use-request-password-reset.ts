import { useMutation } from '@tanstack/react-query'

import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      supabaseAuthRepository.requestPasswordReset(email),
  })
}
