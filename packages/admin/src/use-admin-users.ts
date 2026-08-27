import { useInfiniteQuery } from '@tanstack/react-query'

import { adminQueryKeys } from './admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import type { AdminUserFilters } from '@sadhana-connect/domain'
import { supabaseAdminUserRepository } from '@sadhana-connect/infra-supabase'

export const ADMIN_USERS_PAGE_SIZE = 20

// Same cursor/limit shape as useSadhanaHistory — a filter change changes
// the query key, so the UI never shows stale-filter results while a new
// query loads.
export function useAdminUsers(filters: AdminUserFilters) {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useInfiniteQuery({
    queryKey: adminQueryKeys.users(adminUserId, filters),
    queryFn: ({ pageParam }) =>
      supabaseAdminUserRepository.listUsers({
        ...filters,
        limit: ADMIN_USERS_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: adminUserId !== null,
  })
}
