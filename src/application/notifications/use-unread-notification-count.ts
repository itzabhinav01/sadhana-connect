import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { supabaseNotificationRepository } from '@/infrastructure/supabase/notification-repository'

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
