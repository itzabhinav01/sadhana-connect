import { useProfile } from '@sadhana-connect/auth'
import { Redirect, Stack } from 'expo-router'

// RequireRole equivalent: a UX/navigation guard only, not a security
// boundary. Nested inside (app)/_layout.tsx, which has already resolved
// the loading/error/disabled-account states, so this only branches on role.
export default function MentorLayout() {
  const profile = useProfile()

  if (!profile.data || profile.data.role !== 'mentor') {
    return <Redirect href="/" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
