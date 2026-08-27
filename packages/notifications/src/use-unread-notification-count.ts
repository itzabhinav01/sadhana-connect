import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { notificationQueryKeys } from './notification-query-keys'
import { supabaseNotificationRepository } from '@sadhana-connect/infra-supabase'

export function useUnreadNotificationCount() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(userId),
    queryFn: () => {
      if (!userId) {
        throw new Error('useUnreadNotificationCount: no authenticated user')
      }
      return supabaseNotificationRepository.countUnread(userId)
    },
    enabled: userId !== null,
  })
}
