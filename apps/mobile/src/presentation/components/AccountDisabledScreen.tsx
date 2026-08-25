import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { useSignOut } from '../../application/auth/use-sign-out'
import { colors, fontSize, spacing } from '../../shared/theme'
import { Button } from './Button'

export function AccountDisabledScreen() {
  const router = useRouter()
  const signOut = useSignOut()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account disabled</Text>
      <Text style={styles.description}>
        Your account has been disabled. Please contact your temple administrator for assistance.
      </Text>
      <Button
        title="Log out"
        pendingTitle="Signing out…"
        isPending={signOut.isPending}
        onPress={handleSignOut}
        variant="outline"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.foreground,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: 'center',
  },
})
