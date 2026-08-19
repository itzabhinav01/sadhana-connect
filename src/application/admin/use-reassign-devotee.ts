import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { supabaseAdminAssignmentRepository } from '@/infrastructure/supabase/admin-assignment-repository'

// Wraps public.reassign_devotee(uuid, uuid) — handles first-time
// assignment, reassignment, and the same-mentor no-op identically (the DB
// function itself decides which case applies). No client-side branching
// duplicates that logic here.
export function useReassignDevotee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ devoteeId, mentorId }: { devoteeId: string; mentorId: string }) =>
      supabaseAdminAssignmentRepository.reassignDevotee(devoteeId, mentorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all })
    },
  })
}
