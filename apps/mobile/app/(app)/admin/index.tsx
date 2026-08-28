import { useAdminDashboardSummary, type AdminDashboardSummary } from '@sadhana-connect/admin'
import { Stack, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const SUMMARY_CARDS: { label: string; key: keyof AdminDashboardSummary }[] = [
  { label: 'Total devotees', key: 'totalDevotees' },
  { label: 'Total mentors', key: 'totalMentors' },
  { label: 'Active accounts', key: 'activeCount' },
  { label: 'Disabled accounts', key: 'disabledCount' },
  { label: 'Deleted accounts', key: 'anonymizedCount' },
  { label: 'Temple groups', key: 'totalTempleGroups' },
  { label: 'Devotees without a mentor', key: 'devoteesWithoutActiveMentor' },
  { label: 'Reports submitted today', key: 'reportsSubmittedToday' },
]

export default function AdminHomeScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const signOut = useSignOut()
  const summaryQuery = useAdminDashboardSummary()

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
        <Card title="Platform Summary">
          {summaryQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}
          {summaryQuery.isError ? (
            <ErrorBanner message="Something went wrong loading the summary." />
          ) : null}
          {summaryQuery.data ? (
            <View style={styles.summaryGrid}>
              {SUMMARY_CARDS.map(({ label, key }) => (
                <View key={key} style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{summaryQuery.data[key]}</Text>
                  <Text style={styles.mutedLine}>{label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

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

        <Card title="Mentors">
          <Text style={styles.mutedLine}>Every mentor and how many devotees they currently have.</Text>
          <Button
            title="View Mentors"
            variant="outline"
            onPress={() => router.push('/admin/mentors')}
          />
        </Card>

        <Card title="Announcements">
          <Text style={styles.mutedLine}>Create, edit, publish, and remove announcements.</Text>
          <Button
            title="Manage Announcements"
            variant="outline"
            onPress={() => router.push('/admin/announcements')}
          />
        </Card>
      </ScrollView>
    </>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    summaryItem: {
      width: '45%',
      gap: 2,
    },
    summaryValue: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.foreground,
    },
  })
}
