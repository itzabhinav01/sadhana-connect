import { useAuth } from '@sadhana-connect/auth'
import { Redirect, Stack } from 'expo-router'

import { LoadingScreen } from '../../src/presentation/components/LoadingScreen'

// PublicOnlyRoute equivalent: redirects an already-authenticated session
// away from login/register/forgot-password back to the app. Deliberately
// not applied to any deep-link recovery screen (none exist yet — see
// sub-phase 23.3's plan; ResetPassword/AuthConfirm are deferred until the
// password-reset-by-email flag is turned on).
export default function AuthLayout() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (session) {
    return <Redirect href="/" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
