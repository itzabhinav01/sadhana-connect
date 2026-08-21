import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAuth } from '@/application/auth/use-auth'
import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { useProfile } from '@/application/profile/use-profile'
import { supabase } from '@/infrastructure/supabase/client'

// Live in-app updates only, while this app is open — NOT push. If the
// tab is closed, nothing is delivered; the devotee simply sees the
// notification next time they load /notifications (Phase 17 v1 scope).
//
// The `filter` below is an efficiency narrowing, not the authorization
// boundary: Supabase Realtime evaluates postgres_changes subscriptions
// under the same RLS policies PostgREST uses, so this client could never
// receive another recipient's row even without the filter — the real
// boundary is notifications_select (recipient_id = auth.uid()), unchanged
// by this hook.
//
// Called unconditionally from AppLayout (rules of hooks), but only ever
// opens a channel for a devotee — notifications are devotee-only in
// Phase 17 v1, so a mentor/admin session must not hold an idle
// subscription it will never receive anything on.
export function useNotificationsRealtime() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const profile = useProfile()
  const userId = session?.userId ?? null
  const isDevotee = profile.data?.role === 'devotee'

  useEffect(() => {
    if (!userId || !isDevotee) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Refetch rather than manually splicing the new row into the
          // cache — guarantees no duplicate rows regardless of any race
          // with an in-flight manual fetch or "Load more" page fetch.
          queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.list(userId),
          })
          queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.unreadCount(userId),
          })
        },
      )
      .subscribe()

    // The Supabase JS client handles socket-level reconnection
    // internally; unsubscribing on unmount/userId change (account
    // switch) is this hook's own responsibility, so a stale channel from
    // a previous user is never left listening.
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, isDevotee, queryClient])
}
