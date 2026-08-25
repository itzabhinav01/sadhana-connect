import { useProfile } from '@sadhana-connect/auth'
import { Redirect, Stack } from 'expo-router'

// RequireRole equivalent: a UX/navigation guard only, not a security
// boundary. Nested inside (app)/_layout.tsx, which has already resolved
// the loading/error/disabled-account states, so this only branches on role.
export default function DevoteeLayout() {
  const profile = useProfile()

  if (!profile.data || profile.data.role !== 'devotee') {
    return <Redirect href="/" />
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="sadhana" options={{ title: 'Daily Sadhana' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="verse" options={{ title: 'Verse of the Day' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  )
}
