import { useProfile } from '@sadhana-connect/auth'
import {
  useNotificationsRealtime,
  useUnreadNotificationCount,
  type RealtimeInsertedNotification,
} from '@sadhana-connect/notifications'
import { Redirect, Tabs } from 'expo-router'
import { useCallback, useEffect } from 'react'
import type { ColorValue } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { dailySadhanaNotificationService } from '../../../src/infrastructure/notifications/daily-sadhana-notification-service'
import { HeaderThemeToggle } from '../../../src/presentation/components/HeaderThemeToggle'
import { Icon } from '../../../src/presentation/components/Icon'
import type { IconName } from '../../../src/presentation/components/Icon'

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Icon name={focused ? active : inactive} color={color as string} size={22} />
  }
  return TabIcon
}

function resolveNotificationTargetUrl(notification: RealtimeInsertedNotification): string {
  if (notification.type === 'announcement' && notification.relatedAnnouncementId) {
    return `/devotee/announcements/${notification.relatedAnnouncementId}`
  }
  if (notification.type === 'mentor_comment' || notification.type === 'sadhana_reminder') {
    return '/devotee/sadhana'
  }
  if (notification.type === 'data_retention') {
    return '/devotee/history'
  }
  return '/devotee/notifications'
}

export default function DevoteeLayout() {
  const profile = useProfile()
  const { colors } = useTheme()
  const isDevotee = profile.data?.role === 'devotee'

  useEffect(() => {
    if (isDevotee) {
      void dailySadhanaNotificationService.registerPushTokenAsync()
    }
  }, [isDevotee])

  const handleRealtimeNotification = useCallback((notification: RealtimeInsertedNotification) => {
    void dailySadhanaNotificationService.presentAlertNotification({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      url: resolveNotificationTargetUrl(notification),
    })
  }, [])

  useNotificationsRealtime(handleRealtimeNotification)
  const unreadCount = useUnreadNotificationCount()

  if (!profile.data || profile.data.role !== 'devotee') {
    return <Redirect href="/" />
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerRight: () => <HeaderThemeToggle />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="sadhana"
        options={{ title: 'Sadhana', tabBarIcon: tabIcon('book', 'book-outline') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: tabIcon('time', 'time-outline') }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'Analytics', tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: tabIcon('notifications', 'notifications-outline'),
          tabBarBadge: unreadCount.data ? unreadCount.data : undefined,
        }}
      />
      <Tabs.Screen name="japa" options={{ title: 'Japa Counter', href: null }} />
      <Tabs.Screen name="verse" options={{ title: 'Verse of the Day', href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', href: null }} />
      <Tabs.Screen name="announcements" options={{ title: 'Announcements', href: null }} />
      <Tabs.Screen name="announcements/[id]" options={{ title: 'Announcement', href: null }} />
    </Tabs>
  )
}
