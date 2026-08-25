import { useMutation } from '@tanstack/react-query'

import type { ConfirmEmailParams } from '@sadhana-connect/domain'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase'

export function useConfirmEmail() {
  return useMutation({
    mutationFn: (params: ConfirmEmailParams) =>
      supabaseAuthRepository.confirmEmail(params),
  })
}
