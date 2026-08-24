import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { supabaseNotificationRepository } from '@sadhana-connect/infra-supabase/notification-repository'

export function useMarkAllNotificationsRead() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: () => {
      if (!userId) {
        throw new Error('useMarkAllNotificationsRead: no authenticated user')
      }
      return supabaseNotificationRepository.markAllRead(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(userId) })
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(userId),
      })
    },
  })
}
