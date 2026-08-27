import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from './admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminTempleGroupRepository } from '@sadhana-connect/infra-supabase'

export function useAdminTempleGroups() {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.templeGroups(adminUserId),
    queryFn: () => supabaseAdminTempleGroupRepository.listTempleGroups(),
    enabled: adminUserId !== null,
  })
}
