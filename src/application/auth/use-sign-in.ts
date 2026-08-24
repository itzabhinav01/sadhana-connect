import { useMutation } from '@tanstack/react-query'

import type { SignInParams } from '@sadhana-connect/domain/repositories/auth-repository'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase/auth-repository'

export function useSignIn() {
  return useMutation({
    mutationFn: (params: SignInParams) => supabaseAuthRepository.signIn(params),
  })
}
