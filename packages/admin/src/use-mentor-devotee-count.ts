import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from './admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminAssignmentRepository } from '@sadhana-connect/infra-supabase'

// Backs the Mentor -> Devotee role-change gate (presentation-time check)
// and the mentor detail view's assigned-devotee count. Reads
// admin_mentor_assignment_counts (migration 0005) — a plain, always-live
// query, never a cached/materialized snapshot.
export function useMentorDevoteeCount(mentorId: string | null) {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.mentorDevoteeCount(adminUserId, mentorId ?? ''),
    queryFn: () => supabaseAdminAssignmentRepository.getMentorDevoteeCount(mentorId as string),
    enabled: adminUserId !== null && mentorId !== null,
  })
}
