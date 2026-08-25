import {
  useDevoteeAssignedSince,
  useDevoteeProfile,
  useDevoteeTodayReport,
} from '@sadhana-connect/mentor'
import {
  getLastNDaysRange,
  useDevoteeReportHistory,
  validateDateRange,
  type SadhanaDateRange,
} from '@sadhana-connect/sadhana'
import { buildDateRangeList } from '@sadhana-connect/shared'
import type { SadhanaReportHistoryEntry } from '@sadhana-connect/domain'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '../../../../src/presentation/components/Button'
import { Card } from '../../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../../src/presentation/components/LoadingScreen'
import { colors, fontSize, spacing } from '../../../../src/shared/theme'

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
] as const

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function ReadOnlyReportRow({ report }: { report: SadhanaReportHistoryEntry }) {
  return (
    <View style={styles.reportRow}>
      <Text style={styles.reportDate}>{formatDisplayDate(report.reportDate)}</Text>
      <Text style={styles.rowMuted}>
        {report.totalRounds} rounds · {report.readingMinutes}m reading ·{' '}
        {report.hearingMinutes}m hearing
      </Text>
    </View>
  )
}

export default function MentorDevoteeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const devoteeId = id ?? ''
  const [selectedDays, setSelectedDays] = useState<number>(7)

  const profileQuery = useDevoteeProfile(devoteeId)
  const todayReportQuery = useDevoteeTodayReport(devoteeId)
  const assignedSinceQuery = useDevoteeAssignedSince(devoteeId)

  const range: SadhanaDateRange = getLastNDaysRange(selectedDays)
  const validation = validateDateRange(range.fromDate, range.toDate)
  const historyQuery = useDevoteeReportHistory(devoteeId, range.fromDate, range.toDate, {
    enabled: validation.valid,
  })

  const allDates = validation.valid ? buildDateRangeList(range.fromDate, range.toDate) : []
  const filledDates = new Set(historyQuery.data?.map((report) => report.reportDate) ?? [])
  const missedDates = allDates.filter((date) => !filledDates.has(date))

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
            <ReadOnlyReportRow report={todayReportQuery.data} />
          ) : null}
        </Card>

        <Card title="Sadhana History">
          <View style={styles.filterRow}>
            {PRESETS.map((preset) => (
              <Button
                key={preset.days}
                title={preset.label}
                variant={selectedDays === preset.days ? 'primary' : 'outline'}
                onPress={() => setSelectedDays(preset.days)}
              />
            ))}
          </View>

          {validation.valid && historyQuery.isPending ? (
            <Text style={styles.rowMuted}>Loading…</Text>
          ) : null}
          {validation.valid && historyQuery.isError ? (
            <ErrorBanner message="Something went wrong loading this devotee's history." />
          ) : null}
          {validation.valid && historyQuery.isSuccess ? (
            <Text style={styles.rowMuted}>
              {missedDates.length === 0
                ? `All ${allDates.length} days filled in this range.`
                : `Missed ${missedDates.length} of ${allDates.length} days.`}
            </Text>
          ) : null}
          {validation.valid && historyQuery.isSuccess && historyQuery.data.length === 0 ? (
            <Text style={styles.rowMuted}>No reports in this range.</Text>
          ) : null}
          {validation.valid && historyQuery.isSuccess && historyQuery.data.length > 0
            ? [...historyQuery.data]
                .sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1))
                .map((report) => <ReadOnlyReportRow key={report.id} report={report} />)
            : null}
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reportRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  reportDate: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
  },
})
