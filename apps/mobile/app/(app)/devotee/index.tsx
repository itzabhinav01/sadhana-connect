import {
  useRecentSadhanaReports,
  useSadhanaReport,
  useSadhanaStreak,
  useWeeklySadhanaSummary,
} from '@sadhana-connect/sadhana'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { Stack, useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { SadhanaReportRow } from '../../../src/presentation/components/SadhanaReportRow'
import { colors, fontSize, spacing } from '../../../src/shared/theme'

const RECENT_REPORTS_DISPLAY_COUNT = 5

export default function DashboardScreen() {
  const router = useRouter()
  const signOut = useSignOut()
  const today = getLocalDateIso()

  const todayReport = useSadhanaReport(today)
  const streak = useSadhanaStreak()
  const weeklySummary = useWeeklySadhanaSummary()
  const recentReports = useRecentSadhanaReports()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  if (todayReport.isPending) {
    return <LoadingScreen />
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
        <Card title="Today's Sadhana">
          <Text style={styles.mutedLine}>
            Current streak: {streak.data ?? 0} day{streak.data === 1 ? '' : 's'}
          </Text>
          {todayReport.data ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{todayReport.data.totalRounds}</Text>
                  <Text style={styles.statLabel}>Rounds</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{todayReport.data.readingMinutes}</Text>
                  <Text style={styles.statLabel}>Reading (min)</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{todayReport.data.hearingMinutes}</Text>
                  <Text style={styles.statLabel}>Hearing (min)</Text>
                </View>
              </View>
              <Button
                title="Edit Sadhana"
                onPress={() => router.push({ pathname: '/devotee/sadhana', params: { date: today } })}
                variant="outline"
              />
            </>
          ) : (
            <>
              <Text style={styles.mutedLine}>You haven&apos;t logged today&apos;s sadhana yet.</Text>
              <Button
                title="Fill Sadhana"
                onPress={() => router.push({ pathname: '/devotee/sadhana', params: { date: today } })}
              />
            </>
          )}
        </Card>

        <Card title="Weekly Summary">
          {weeklySummary.data ? (
            <>
              <Text style={styles.mutedLine}>
                {weeklySummary.data.startDate} – {weeklySummary.data.endDate}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{weeklySummary.data.totalReports}/7</Text>
                  <Text style={styles.statLabel}>Reports</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {Math.round(weeklySummary.data.completionRate * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Completion</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {Math.round(weeklySummary.data.averageTotalRounds)}
                  </Text>
                  <Text style={styles.statLabel}>Avg Rounds</Text>
                </View>
              </View>
              <Text style={styles.mutedLine}>
                Reading: {weeklySummary.data.totalReadingMinutes} min · Hearing:{' '}
                {weeklySummary.data.totalHearingMinutes} min
              </Text>
            </>
          ) : (
            <Text style={styles.mutedLine}>Loading…</Text>
          )}
        </Card>

        <Card title="Recent Reports">
          {recentReports.data && recentReports.data.length > 0 ? (
            recentReports.data.slice(0, RECENT_REPORTS_DISPLAY_COUNT).map((report) => (
              <SadhanaReportRow
                key={report.id}
                reportDate={report.reportDate}
                totalRounds={report.totalRounds}
                readingMinutes={report.readingMinutes}
                hearingMinutes={report.hearingMinutes}
              />
            ))
          ) : (
            <Text style={styles.mutedLine}>No reports yet — your submissions will show up here.</Text>
          )}
          <Button
            title="View History"
            onPress={() => router.push('/devotee/history')}
            variant="outline"
          />
        </Card>

        <Button
          title="Verse of the Day"
          onPress={() => router.push('/devotee/verse')}
          variant="outline"
        />

        <Button
          title="Analytics"
          onPress={() => router.push('/devotee/analytics')}
          variant="outline"
        />

        <Button
          title="Profile"
          onPress={() => router.push('/devotee/profile')}
          variant="outline"
        />
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
})
