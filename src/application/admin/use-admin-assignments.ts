import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAdminAssignmentRepository } from '@sadhana-connect/infra-supabase/admin-assignment-repository'

export function useAdminAssignments(filters: { mentorId?: string; devoteeId?: string } = {}) {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.assignments(adminUserId, filters),
    queryFn: () => supabaseAdminAssignmentRepository.listAssignments(filters),
    enabled: adminUserId !== null,
  })
}
