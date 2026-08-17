import { useMutation } from '@tanstack/react-query'

import type { SignUpParams } from '@/domain/repositories/auth-repository'
import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

export function useSignUp() {
  return useMutation({
    mutationFn: (params: SignUpParams) => supabaseAuthRepository.signUp(params),
  })
}
