import { useProfile } from '@sadhana-connect/auth'
import { useNotificationsRealtime } from '@sadhana-connect/notifications'
import { Redirect, Stack } from 'expo-router'

import { useTheme } from '../../../src/application/theme/use-theme'

// RequireRole equivalent: a UX/navigation guard only, not a security
// boundary. Nested inside (app)/_layout.tsx, which has already resolved
// the loading/error/disabled-account states, so this only branches on role.
export default function DevoteeLayout() {
  const profile = useProfile()
  const { colors } = useTheme()
  // Safe to call unconditionally here (unlike web's AppLayout, which is
  // shared by every role) — this layout only ever renders for a devotee,
  // matching Phase 17's devotee-only notifications scope.
  useNotificationsRealtime()

  if (!profile.data || profile.data.role !== 'devotee') {
    return <Redirect href="/" />
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="sadhana" options={{ title: 'Daily Sadhana' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="verse" options={{ title: 'Verse of the Day' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="japa" options={{ title: 'Japa Counter' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
      <Stack.Screen name="announcements/[id]" options={{ title: 'Announcement' }} />
    </Stack>
  )
}
