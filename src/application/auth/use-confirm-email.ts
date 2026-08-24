import { useMutation } from '@tanstack/react-query'

import type { ConfirmEmailParams } from '@sadhana-connect/domain/repositories/auth-repository'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase/auth-repository'

export function useConfirmEmail() {
  return useMutation({
    mutationFn: (params: ConfirmEmailParams) =>
      supabaseAuthRepository.confirmEmail(params),
  })
}
