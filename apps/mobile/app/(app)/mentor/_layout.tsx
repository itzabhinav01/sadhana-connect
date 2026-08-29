import { useProfile } from '@sadhana-connect/auth'
import { useUnreadNotificationCount } from '@sadhana-connect/notifications'
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
export default function MentorLayout() {
  const profile = useProfile()
  const { colors } = useTheme()
  const unreadCount = useUnreadNotificationCount()

  if (!profile.data || profile.data.role !== 'mentor') {
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
        options={{ title: 'Devotees', tabBarIcon: tabIcon('people', 'people-outline') }}
      />
      <Tabs.Screen
        name="pending"
        options={{ title: 'Pending', tabBarIcon: tabIcon('hourglass', 'hourglass-outline') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: tabIcon('notifications', 'notifications-outline'),
          tabBarBadge: unreadCount.data ? unreadCount.data : undefined,
        }}
      />
      <Tabs.Screen name="devotee/[id]" options={{ title: 'Devotee', href: null }} />
      <Tabs.Screen name="announcements" options={{ title: 'Announcements', href: null }} />
    </Tabs>
  )
}
