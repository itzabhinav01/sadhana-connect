import { Stack, useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'

import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { colors, fontSize, spacing } from '../../../src/shared/theme'

export default function AdminHomeScreen() {
  const router = useRouter()
  const signOut = useSignOut()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              title="Sign Out"
              pendingTitle="…"
              isPending={signOut.isPending}
              onPress={handleSignOut}
              variant="outline"
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card title="Users">
          <Text style={styles.mutedLine}>Search, view, and manage every account.</Text>
          <Button
            title="Manage Users"
            variant="outline"
            onPress={() => router.push('/admin/users')}
          />
        </Card>

        <Card title="Mentor Assignments">
          <Text style={styles.mutedLine}>Assign devotees to mentors and review history.</Text>
          <Button
            title="Manage Assignments"
            variant="outline"
            onPress={() => router.push('/admin/assignments')}
          />
        </Card>

        <Card title="Temple Groups">
          <Text style={styles.mutedLine}>Create, rename, and manage temple groups.</Text>
          <Button
            title="Manage Temple Groups"
            variant="outline"
            onPress={() => router.push('/admin/temple-groups')}
          />
        </Card>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  mutedLine: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
})
