import { useMutation } from '@tanstack/react-query'

import type { SignInParams } from '@sadhana-connect/domain'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase'

export function useSignIn() {
  return useMutation({
    mutationFn: (params: SignInParams) => supabaseAuthRepository.signIn(params),
  })
}
