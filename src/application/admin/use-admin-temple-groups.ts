import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminTempleGroupRepository } from '@sadhana-connect/infra-supabase/admin-temple-group-repository'

export function useAdminTempleGroups() {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.templeGroups(adminUserId),
    queryFn: () => supabaseAdminTempleGroupRepository.listTempleGroups(),
    enabled: adminUserId !== null,
  })
}
