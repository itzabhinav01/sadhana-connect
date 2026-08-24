import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { supabaseNotificationRepository } from '@sadhana-connect/infra-supabase/notification-repository'

// Ownership is enforced by RLS (notifications_update) — this hook never
// needs to pass or verify the recipient itself.
export function useMarkNotificationRead() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (notificationId: string) =>
      supabaseNotificationRepository.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(userId) })
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(userId),
      })
    },
  })
}
