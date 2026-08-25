import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminAssignmentRepository } from '@sadhana-connect/infra-supabase/admin-assignment-repository'

// All mentors' counts in one query, used by the Mentors list page to avoid
// N+1 per-row count queries.
export function useMentorDevoteeCounts() {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.mentorDevoteeCounts(adminUserId),
    queryFn: () => supabaseAdminAssignmentRepository.listMentorDevoteeCounts(),
    enabled: adminUserId !== null,
  })
}
