import { useMutation } from '@tanstack/react-query'

import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (newPassword: string) =>
      supabaseAuthRepository.updatePassword(newPassword),
  })
}
