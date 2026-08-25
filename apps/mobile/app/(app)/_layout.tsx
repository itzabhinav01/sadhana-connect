import { useAuth, useProfile } from '@sadhana-connect/auth'
import { Redirect, Stack } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { AccountDisabledScreen } from '../../src/presentation/components/AccountDisabledScreen'
import { LoadingScreen } from '../../src/presentation/components/LoadingScreen'
import { colors, fontSize, spacing } from '../../src/shared/theme'

// ProtectedRoute equivalent: authentication (is there a session?) plus a
// UX-level authorization gate (is this profile active?). Neither check is
// a security boundary — every table this profile's role/is_active might
// gate is independently enforced by RLS regardless of what this renders.
export default function AppLayout() {
  const { session, isLoading: isSessionLoading } = useAuth()
  const profile = useProfile()

  if (isSessionLoading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <Redirect href="/login" />
  }

  if (profile.isPending) {
    return <LoadingScreen />
  }

  if (profile.isError || !profile.data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Something went wrong loading your profile. Please try again.
        </Text>
      </View>
    )
  }

  if (!profile.data.isActive) {
    return <AccountDisabledScreen />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.destructive,
    textAlign: 'center',
  },
})
