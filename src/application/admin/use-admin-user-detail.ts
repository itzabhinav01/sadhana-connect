import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAdminUserRepository } from '@/infrastructure/supabase/admin-user-repository'

export function useAdminUserDetail(targetUserId: string) {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.userDetail(adminUserId, targetUserId),
    queryFn: () => supabaseAdminUserRepository.getUserById(targetUserId),
    enabled: adminUserId !== null,
  })
}
