import type { SadhanaNotification } from '@sadhana-connect/domain'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@sadhana-connect/notifications'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { Icon } from '../../../src/presentation/components/Icon'
import type { IconName } from '../../../src/presentation/components/Icon'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString()
}

const NOTIFICATION_TYPE_ICON: Record<SadhanaNotification['type'], IconName> = {
  mentor_comment: 'chatbubble-outline',
  announcement: 'megaphone-outline',
  sadhana_reminder: 'alarm-outline',
  data_retention: 'archive-outline',
  system: 'notifications-outline',
}

interface NotificationRowProps {
  notification: SadhanaNotification
  onPress: (notification: SadhanaNotification) => void
}

function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <Pressable
      onPress={() => onPress(notification)}
      accessibilityRole="button"
      accessibilityLabel={
        notification.isRead ? notification.title : `Unread: ${notification.title}`
      }
      style={styles.row}
    >
      <View style={styles.rowIcon}>
        <Icon name={NOTIFICATION_TYPE_ICON[notification.type]} color={colors.primary} size={18} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowTitle, !notification.isRead && styles.unreadTitle]}>
            {notification.title}
          </Text>
          {!notification.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        {notification.body ? <Text style={styles.rowBodyText}>{notification.body}</Text> : null}
        <Text style={styles.rowTimestamp}>{formatTimestamp(notification.createdAt)}</Text>
      </View>
    </Pressable>
  )
}

// Same generic, RLS-scoped notification feed devotee/notifications.tsx
// uses (useNotifications() reads whatever rows exist for the signed-in
// user, regardless of role) — this is the mentor's Alerts tab per the
// approved 3-tab navigation. mentor_comment and sadhana_reminder are
// devotee-targeted notification types and won't appear in a mentor's own
// feed; only `announcement` has a resolvable mentor-side destination
// today, so every other type falls through and stays on this screen,
// same "unresolvable target" pattern as the devotee screen.
export default function MentorNotificationsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const router = useRouter()
  const notificationsQuery = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = notificationsQuery.data?.pages.flatMap((page) => page.notifications) ?? []
  const hasUnread = notifications.some((notification) => !notification.isRead)

  const handlePress = (notification: SadhanaNotification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id)
    }
    if (notification.type === 'announcement') {
      router.push('/mentor/announcements')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>Alerts</Text>
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
        <NotificationRow key={notification.id} notification={notification} onPress={handlePress} />
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
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    errorLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.destructive,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowTitleLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    rowTitle: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    unreadTitle: {
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    rowBodyText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    rowTimestamp: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
  })
}
