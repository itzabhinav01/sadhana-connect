import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { mentorQueryKeys } from '@/application/mentor/mentor-query-keys'
import { supabaseProfileRepository } from '@sadhana-connect/infra-supabase/profile-repository'

// Reuses the existing, unmodified profile repository — getProfile has no
// special-casing for "own profile" vs. "someone else's," so calling it
// with a devoteeId works exactly the same way, and RLS (profiles_select,
// via private.is_mentor_of) decides what comes back. A null result here
// means "not accessible" — and, by design, does not distinguish "doesn't
// exist" from "not an assigned devotee" (see the detail page).
export function useDevoteeProfile(devoteeId: string) {
  const { session } = useAuth()
  const mentorUserId = session?.userId ?? null

  return useQuery({
    queryKey: mentorQueryKeys.devoteeProfile(mentorUserId, devoteeId),
    queryFn: () => supabaseProfileRepository.getProfile(devoteeId),
    enabled: mentorUserId !== null,
  })
}
