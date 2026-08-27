import { useInfiniteQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { notificationQueryKeys } from './notification-query-keys'
import type { NotificationListCursor } from '@sadhana-connect/domain'
import { supabaseNotificationRepository } from '@sadhana-connect/infra-supabase'

export const NOTIFICATIONS_PAGE_SIZE = 20

// Keyset-paginated (never offset) — see NotificationListCursor for why a
// compound (created_at, id) cursor is required.
export function useNotifications() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useInfiniteQuery({
    queryKey: notificationQueryKeys.list(userId),
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('useNotifications: no authenticated user')
      }
      return supabaseNotificationRepository.listNotifications(userId, {
        limit: NOTIFICATIONS_PAGE_SIZE,
        cursor: pageParam,
      })
    },
    initialPageParam: null as NotificationListCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: userId !== null,
  })
}
