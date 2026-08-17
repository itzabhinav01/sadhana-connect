import { useMutation } from '@tanstack/react-query'

import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

export function useSignOut() {
  return useMutation({
    mutationFn: () => supabaseAuthRepository.signOut(),
  })
}
