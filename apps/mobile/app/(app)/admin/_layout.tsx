import { useProfile } from '@sadhana-connect/auth'
import { Redirect, Stack } from 'expo-router'

// RequireRole equivalent: a UX/navigation guard only, not a security
// boundary. Nested inside (app)/_layout.tsx, which has already resolved
// the loading/error/disabled-account states, so this only branches on role.
export default function AdminLayout() {
  const profile = useProfile()

  if (!profile.data || profile.data.role !== 'super_admin') {
    return <Redirect href="/" />
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="users/index" options={{ title: 'Users' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'User' }} />
      <Stack.Screen name="assignments" options={{ title: 'Mentor Assignments' }} />
      <Stack.Screen name="temple-groups" options={{ title: 'Temple Groups' }} />
    </Stack>
  )
}
