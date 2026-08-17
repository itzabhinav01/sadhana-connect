import { useMutation } from '@tanstack/react-query'

import type { SignInParams } from '@/domain/repositories/auth-repository'
import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

export function useSignIn() {
  return useMutation({
    mutationFn: (params: SignInParams) => supabaseAuthRepository.signIn(params),
  })
}
