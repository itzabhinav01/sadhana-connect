import { useMutation } from '@tanstack/react-query'

import { supabaseAdminAccountActionsRepository } from '@sadhana-connect/infra-supabase'

// Deliberately a plain useMutation with no queryKey — the result (a
// one-time recovery link) must never be cached, logged, or persisted.
// TanStack Query only stores mutation results by reference in this hook's
// own return value; nothing here writes it into the query cache. The
// caller is responsible for discarding it once the confirmation modal
// closes (never storing it in localStorage or state that outlives the
// modal).
export function useGenerateRecoveryLink() {
  return useMutation({
    mutationFn: (targetUserId: string) =>
      supabaseAdminAccountActionsRepository.generateRecoveryLink(targetUserId),
  })
}
