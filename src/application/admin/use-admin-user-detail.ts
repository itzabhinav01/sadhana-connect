import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminUserRepository } from '@sadhana-connect/infra-supabase/admin-user-repository'

export function useAdminUserDetail(targetUserId: string) {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.userDetail(adminUserId, targetUserId),
    queryFn: () => supabaseAdminUserRepository.getUserById(targetUserId),
    enabled: adminUserId !== null,
  })
}
