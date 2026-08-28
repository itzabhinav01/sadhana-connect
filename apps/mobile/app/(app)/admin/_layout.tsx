import { useProfile } from '@sadhana-connect/auth'
import { Redirect, Stack } from 'expo-router'

import { useTheme } from '../../../src/application/theme/use-theme'

// RequireRole equivalent: a UX/navigation guard only, not a security
// boundary. Nested inside (app)/_layout.tsx, which has already resolved
// the loading/error/disabled-account states, so this only branches on role.
export default function AdminLayout() {
  const profile = useProfile()
  const { colors } = useTheme()

  if (!profile.data || profile.data.role !== 'super_admin') {
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
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="users/index" options={{ title: 'Users' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'User' }} />
      <Stack.Screen name="assignments" options={{ title: 'Mentor Assignments' }} />
      <Stack.Screen name="temple-groups" options={{ title: 'Temple Groups' }} />
      <Stack.Screen name="mentors" options={{ title: 'Mentors' }} />
      <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
    </Stack>
  )
}
