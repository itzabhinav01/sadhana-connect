import { useMutation } from '@tanstack/react-query'

import { supabaseAdminAccountActionsRepository } from '@/infrastructure/supabase/admin-account-actions-repository'

// On-demand only, mirrors useGenerateRecoveryLink's mutation shape — not a
// disabled useQuery + manual refetch(). That earlier shape failed to
// reliably surface isError to the UI on a failed fetch (observed live: the
// button silently reverted to its default state instead of showing the
// error). A mutation's isPending/isError/data settle synchronously with
// the resolved/rejected promise, with no enabled/retry interaction to
// reason about, and nothing here auto-fires on mount — the fetch only
// ever happens when AdminUserEmailReveal calls mutate().
export function useRevealUserEmail() {
  return useMutation({
    mutationFn: (targetUserId: string) =>
      supabaseAdminAccountActionsRepository.getUserEmail(targetUserId),
  })
}
