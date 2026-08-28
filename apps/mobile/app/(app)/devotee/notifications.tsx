import { useQueryClient } from '@tanstack/react-query'
import type { SadhanaNotification } from '@sadhana-connect/domain'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@sadhana-connect/notifications'
import { useAuth } from '@sadhana-connect/auth'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString()
}

interface NotificationRowProps {
  notification: SadhanaNotification
  onPress: (notification: SadhanaNotification) => void
  isNavigating: boolean
}

function NotificationRow({ notification, onPress, isNavigating }: NotificationRowProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <Pressable
      onPress={() => onPress(notification)}
      disabled={isNavigating}
      accessibilityRole="button"
      accessibilityLabel={
        notification.isRead ? notification.title : `Unread: ${notification.title}`
      }
      style={[styles.row, !notification.isRead && styles.unreadRow]}
    >
      <Text style={[styles.rowTitle, !notification.isRead && styles.unreadTitle]}>
        {notification.title}
      </Text>
      {notification.body ? <Text style={styles.rowBody}>{notification.body}</Text> : null}
      <Text style={styles.rowTimestamp}>{formatTimestamp(notification.createdAt)}</Text>
    </Pressable>
  )
}

// Mobile equivalent of web's useNotificationNavigation. mentor_comment,
// announcement, and sadhana_reminder all resolve to existing mobile
// routes; an unresolvable target (deleted/expired) falls through and
// simply stays on the notifications screen, same as web.
function useNavigateToNotification() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return async function navigateToNotification(notification: SadhanaNotification): Promise<void> {
    if (notification.type === 'mentor_comment' && notification.relatedReportId) {
      const reportId = notification.relatedReportId
      const reportDate = await queryClient.fetchQuery({
        queryKey: ['sadhana-report', 'date-by-id', userId, reportId],
        queryFn: () => supabaseSadhanaReportRepository.getReportDateById(reportId),
      })
      if (reportDate) {
        router.push({ pathname: '/devotee/sadhana', params: { date: reportDate } })
        return
      }
    }

    if (notification.type === 'announcement' && notification.relatedAnnouncementId) {
      router.push(`/devotee/announcements/${notification.relatedAnnouncementId}`)
      return
    }

    if (notification.type === 'sadhana_reminder') {
      router.push('/devotee/sadhana')
    }
  }
}

export default function NotificationsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const notificationsQuery = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const navigateToNotification = useNavigateToNotification()
  const [isNavigating, setIsNavigating] = useState(false)

  const notifications = notificationsQuery.data?.pages.flatMap((page) => page.notifications) ?? []
  const hasUnread = notifications.some((notification) => !notification.isRead)

  const handlePress = async (notification: SadhanaNotification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id)
    }
    setIsNavigating(true)
    try {
      await navigateToNotification(notification)
    } finally {
      setIsNavigating(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>Notifications</Text>
        <Button
          title="Mark all read"
          pendingTitle="Marking…"
          isPending={markAllRead.isPending}
          disabled={!hasUnread}
          onPress={() => markAllRead.mutate()}
          variant="outline"
        />
      </View>

      {notificationsQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}

      {notificationsQuery.isError ? (
        <Text style={styles.errorLine}>
          Something went wrong loading your notifications. Please try again.
        </Text>
      ) : null}

      {notificationsQuery.isSuccess && notifications.length === 0 ? (
        <Text style={styles.mutedLine}>No notifications yet.</Text>
      ) : null}

      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          onPress={handlePress}
          isNavigating={isNavigating}
        />
      ))}

      {notificationsQuery.hasNextPage ? (
        <Button
          title="Load more"
          pendingTitle="Loading…"
          isPending={notificationsQuery.isFetchingNextPage}
          onPress={() => notificationsQuery.fetchNextPage()}
          variant="outline"
        />
      ) : null}
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    heading: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.foreground,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    errorLine: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
    row: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 2,
    },
    unreadRow: {
      backgroundColor: colors.mutedBackground,
    },
    rowTitle: {
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    unreadTitle: {
      fontWeight: '700',
    },
    rowBody: {
      fontSize: fontSize.sm,
      color: colors.foreground,
    },
    rowTimestamp: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
  })
}
