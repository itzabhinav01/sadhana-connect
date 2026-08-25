import { useProfile } from '@sadhana-connect/auth'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { useSignOut } from '../../application/auth/use-sign-out'
import { colors, fontSize, spacing } from '../../shared/theme'
import { Button } from './Button'

export function RoleHomeScreen({ roleLabel }: { roleLabel: string }) {
  const profile = useProfile()
  const router = useRouter()
  const signOut = useSignOut()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roleLabel} home</Text>
      <Text style={styles.subtitle}>Signed in as {profile.data?.fullName ?? '…'}</Text>
      <Button
        title="Sign out"
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
  subtitle: {
    fontSize: fontSize.base,
    color: colors.muted,
  },
})
