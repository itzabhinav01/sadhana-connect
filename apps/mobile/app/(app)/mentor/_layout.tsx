import { useProfile } from '@sadhana-connect/auth'
import { Redirect, Stack } from 'expo-router'

import { useTheme } from '../../../src/application/theme/use-theme'

// RequireRole equivalent: a UX/navigation guard only, not a security
// boundary. Nested inside (app)/_layout.tsx, which has already resolved
// the loading/error/disabled-account states, so this only branches on role.
export default function MentorLayout() {
  const profile = useProfile()
  const { colors } = useTheme()

  if (!profile.data || profile.data.role !== 'mentor') {
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
      <Stack.Screen name="index" options={{ title: 'My Devotees' }} />
      <Stack.Screen name="devotee/[id]" options={{ title: 'Devotee' }} />
      <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
    </Stack>
  )
}
