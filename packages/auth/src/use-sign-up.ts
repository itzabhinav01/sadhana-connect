import { useMutation } from '@tanstack/react-query'

import type { SignUpParams } from '@sadhana-connect/domain'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase'

export function useSignUp() {
  return useMutation({
    mutationFn: (params: SignUpParams) => supabaseAuthRepository.signUp(params),
  })
}
