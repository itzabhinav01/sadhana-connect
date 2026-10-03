import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { useAuth, useProfile } from '@sadhana-connect/auth'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { notificationQueryKeys } from './notification-query-keys'

export interface RealtimeInsertedNotification {
  id: string
  type: string
  title: string
  body: string | null
  relatedReportId: string | null
  relatedAnnouncementId: string | null
}

interface PostgresInsertPayload {
  new?: {
    id?: string
    type?: string
    title?: string
    body?: string | null
    related_report_id?: string | null
    related_announcement_id?: string | null
  }
}

export function useNotificationsRealtime(
  onNotificationInserted?: (notification: RealtimeInsertedNotification) => void,
) {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const profile = useProfile()
  const userId = session?.userId ?? null
  const isDevotee = profile.data?.role === 'devotee'
  const callbackRef = useRef(onNotificationInserted)

  useEffect(() => {
    callbackRef.current = onNotificationInserted
  }, [onNotificationInserted])

  useEffect(() => {
    if (!userId || !isDevotee) return

    const supabase = getSupabaseClient()
    const topic = `notifications:${userId}`

    if (typeof supabase.getChannels === 'function') {
      const existing = supabase
        .getChannels()
        .find((c) => c.topic === `realtime:${topic}` || c.topic === topic)
      if (existing) {
        supabase.removeChannel(existing)
      }
    }

    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload?: PostgresInsertPayload) => {
          queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.list(userId),
          })
          queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.unreadCount(userId),
          })

          const row = payload?.new
          if (row && typeof row.id === 'string' && typeof row.title === 'string') {
            const mapped: RealtimeInsertedNotification = {
              id: row.id,
              type: row.type ?? 'system',
              title: row.title,
              body: row.body ?? null,
              relatedReportId: row.related_report_id ?? null,
              relatedAnnouncementId: row.related_announcement_id ?? null,
            }

            if (callbackRef.current) {
              callbackRef.current(mapped)
            } else if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              window.Notification.permission === 'granted'
            ) {
              try {
                new window.Notification(mapped.title, {
                  body: mapped.body ?? undefined,
                  tag: mapped.id,
                })
              } catch {
                // Ignore in environments that block Notification constructor
              }
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, isDevotee, queryClient])
}
