import { QueryClient, QueryClientContext, useQuery } from '@tanstack/react-query'
import { useContext } from 'react'

import { useAuth, useProfile } from '@sadhana-connect/auth'
import { getEffectiveTempleGroupIds, type TempleGroup } from '@sadhana-connect/domain'
import { supabaseAdminTempleGroupRepository } from '@sadhana-connect/infra-supabase'

const fallbackQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

export function useMentorTempleGroups() {
  const contextQueryClient = useContext(QueryClientContext)
  const { session } = useAuth()
  const profile = useProfile()
  const userId = session?.userId ?? null
  const assignedGroupIds = getEffectiveTempleGroupIds(profile.data)

  return useQuery(
    {
      queryKey: ['announcements', 'mentor-temple-groups', userId, assignedGroupIds] as const,
      queryFn: async (): Promise<TempleGroup[]> => {
        if (assignedGroupIds.length === 0) return []
        const allGroups = await supabaseAdminTempleGroupRepository.listTempleGroups()
        return allGroups.filter((group) => assignedGroupIds.includes(group.id))
      },
      enabled: Boolean(contextQueryClient) && userId !== null && assignedGroupIds.length > 0,
    },
    contextQueryClient ?? fallbackQueryClient,
  )
}
