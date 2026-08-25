import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { mentorQueryKeys } from './mentor-query-keys'
import { supabaseMentorRepository } from '@sadhana-connect/infra-supabase'

// Fetched fresh rather than reused from the dashboard list's row data, so
// the devotee detail page works correctly on a direct URL visit, not only
// when navigated to from the list.
export function useDevoteeAssignedSince(devoteeId: string) {
  const { session } = useAuth()
  const mentorUserId = session?.userId ?? null

  return useQuery({
    queryKey: mentorQueryKeys.devoteeAssignedSince(mentorUserId, devoteeId),
    queryFn: () => {
      if (!mentorUserId) {
        throw new Error('useDevoteeAssignedSince: no authenticated user')
      }
      return supabaseMentorRepository.getAssignedSince(mentorUserId, devoteeId)
    },
    enabled: mentorUserId !== null,
  })
}
