import { useMutation } from '@tanstack/react-query'

import type { ConfirmEmailParams } from '@/domain/repositories/auth-repository'
import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

export function useConfirmEmail() {
  return useMutation({
    mutationFn: (params: ConfirmEmailParams) =>
      supabaseAuthRepository.confirmEmail(params),
  })
}
