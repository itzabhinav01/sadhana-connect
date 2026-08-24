import { useMutation } from '@tanstack/react-query'

import type { SignUpParams } from '@sadhana-connect/domain/repositories/auth-repository'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase/auth-repository'

export function useSignUp() {
  return useMutation({
    mutationFn: (params: SignUpParams) => supabaseAuthRepository.signUp(params),
  })
}
