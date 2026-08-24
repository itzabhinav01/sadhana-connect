import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAdminAssignmentRepository } from '@sadhana-connect/infra-supabase/admin-assignment-repository'

// Exact required copy — the RPC (public.assign_devotee_to_mentor, 0015)
// raises a message prefixed "MENTOR_CAP_REACHED:" specifically so this
// hook can recognize it and surface a friendly, typed error instead of a
// generic failure message. Same pattern as ReminderRateLimitedError
// (use-send-reminder.ts) and MentorHasActiveDevoteesError
// (use-change-user-role.ts).
export const MENTOR_CAP_REACHED_MESSAGE =
  'This devotee already has the maximum of 3 active mentors.'

export class MentorCapReachedError extends Error {
  constructor() {
    super(MENTOR_CAP_REACHED_MESSAGE)
    this.name = 'MentorCapReachedError'
  }
}

// Additive only — assigning a mentor never deactivates any of the
// devotee's other active mentors (up to the approved cap of 3). Handles
// the first-assignment and already-assigned-to-this-mentor cases
// identically (the DB function itself decides which case applies, same
// no-op reasoning the old reassign_devotee used). No client-side
// branching duplicates that logic here.
export function useAssignMentor() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: async ({ devoteeId, mentorId }: { devoteeId: string; mentorId: string }) => {
      try {
        return await supabaseAdminAssignmentRepository.assignMentor(devoteeId, mentorId)
      } catch (error) {
        // Deliberately NOT `error instanceof Error` — see
        // use-send-reminder.ts for the confirmed reason a PostgREST RPC
        // error fails that check at runtime despite PostgrestError's own
        // class declaration extending Error.
        const message = (error as { message?: unknown } | null)?.message
        if (typeof message === 'string' && message.includes('MENTOR_CAP_REACHED')) {
          throw new MentorCapReachedError()
        }
        throw error
      }
    },
    // Traced (Phase 20): assigning a mentor adds a mentor_assignments
    // row, which affects the Assignments list/panels (including
    // AdminUserDetailPage's per-devotee "Current mentors" panel, same
    // assignments key prefix), the new mentor's devotee count, and the
    // dashboard's devoteesWithoutActiveMentor figure. It never touches
    // any profile field, so Users/userDetail/templeGroups are
    // deliberately left untouched.
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'assignments', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.mentorDevoteeCounts(adminUserId),
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'mentor-devotee-count', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardSummary(adminUserId),
      })
    },
  })
}
