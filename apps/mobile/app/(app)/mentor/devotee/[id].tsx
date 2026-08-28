import {
  useDevoteeAssignedSince,
  useDevoteeProfile,
  useDevoteeTodayReport,
} from '@sadhana-connect/mentor'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../../src/application/theme/use-theme'
import { Card } from '../../../../src/presentation/components/Card'
import {
  DevoteeSadhanaHistorySection,
  ReadOnlyReportRow,
} from '../../../../src/presentation/components/DevoteeSadhanaHistorySection'
import { ErrorBanner } from '../../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../../src/presentation/components/LoadingScreen'
import { ReminderForm } from '../../../../src/presentation/components/ReminderForm'
import { fontSize, spacing } from '../../../../src/shared/theme'
import type { ThemeColors } from '../../../../src/shared/theme'

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

export default function MentorDevoteeDetailScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { id } = useLocalSearchParams<{ id: string }>()
  const devoteeId = id ?? ''

  const profileQuery = useDevoteeProfile(devoteeId)
  const todayReportQuery = useDevoteeTodayReport(devoteeId)
  const assignedSinceQuery = useDevoteeAssignedSince(devoteeId)

  if (profileQuery.isPending) {
    return <LoadingScreen />
  }

  if (profileQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message="Something went wrong loading this devotee. Please try again." />
      </View>
    )
  }

  if (profileQuery.data === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.rowMuted}>This devotee isn&apos;t available.</Text>
      </View>
    )
  }

  const profile = profileQuery.data

  return (
    <>
      <Stack.Screen options={{ title: profile.fullName }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.heading} accessibilityRole="header">
            {profile.fullName}
          </Text>
          {assignedSinceQuery.data ? (
            <Text style={styles.rowMuted}>
              Assigned since {formatDisplayDate(assignedSinceQuery.data.slice(0, 10))}
            </Text>
          ) : null}
          <Text style={styles.rowMuted}>Phone: {profile.phoneNumber ?? 'Not provided'}</Text>
        </View>

        <Card title="Today's Sadhana">
          {todayReportQuery.isPending ? <Text style={styles.rowMuted}>Loading…</Text> : null}
          {todayReportQuery.isError ? (
            <ErrorBanner message="Something went wrong loading today's report." />
          ) : null}
          {todayReportQuery.isSuccess && todayReportQuery.data === null ? (
            <Text style={styles.rowMuted}>Not submitted yet today.</Text>
          ) : null}
          {todayReportQuery.isSuccess && todayReportQuery.data ? (
            <ReadOnlyReportRow report={todayReportQuery.data} showComments />
          ) : null}
        </Card>

        <DevoteeSadhanaHistorySection devoteeId={devoteeId} showComments />

        <ReminderForm devoteeId={devoteeId} />
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    heading: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.foreground,
    },
    rowMuted: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
  })
}
