import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase'

// Unlike web's useSignOut, this clears the whole query cache rather than
// enumerating per-feature query-key modules: mobile has no accumulated
// feature query keys yet, and clearing everything on sign-out is always
// safe (never wrong, just occasionally clears a little more than strictly
// necessary).
export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => supabaseAuthRepository.signOut(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
