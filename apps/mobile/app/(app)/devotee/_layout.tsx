import { useProfile } from '@sadhana-connect/auth'
import { useNotificationsRealtime, useUnreadNotificationCount } from '@sadhana-connect/notifications'
import { Redirect, Tabs } from 'expo-router'
import type { ColorValue } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { HeaderThemeToggle } from '../../../src/presentation/components/HeaderThemeToggle'
import { Icon } from '../../../src/presentation/components/Icon'
import type { IconName } from '../../../src/presentation/components/Icon'

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Icon name={focused ? active : inactive} color={color as string} size={22} />
  }
  return TabIcon
}

// RequireRole equivalent: a UX/navigation guard only, not a security
// boundary. Nested inside (app)/_layout.tsx, which has already resolved
// the loading/error/disabled-account states, so this only branches on role.
//
// 5 primary destinations live in the bottom tab bar (Home, Sadhana,
// History, Analytics, Alerts) — everything else (Verse, Profile,
// Settings, Announcements) stays reachable by push but is hidden from
// the bar via `href: null`, per the approved navigation redesign.
// Announcements is deliberately NOT a tab: it has a preview on Home, a
// normal push destination, and a notification click-through target, but
// no permanent tab slot.
export default function DevoteeLayout() {
  const profile = useProfile()
  const { colors } = useTheme()
  // Safe to call unconditionally here (unlike web's AppLayout, which is
  // shared by every role) — this layout only ever renders for a devotee,
  // matching Phase 17's devotee-only notifications scope.
  useNotificationsRealtime()
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
