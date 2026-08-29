import { getLastNDaysRange, useSadhanaAnalytics } from '@sadhana-connect/sadhana'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { Sparkline } from '../../../src/presentation/components/Sparkline'
import { fontFamily, fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const

function formatMinutes(value: number) {
  return `${Math.round(value)} min`
}

function formatAverage(value: number, hasSubmittedDays: boolean, format: (v: number) => string) {
  return hasSubmittedDays ? format(value) : '—'
}

export default function AnalyticsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [selectedDays, setSelectedDays] = useState<number>(30)
  const range = getLastNDaysRange(selectedDays)

  const analyticsQuery = useSadhanaAnalytics(range.fromDate, range.toDate)
  const summary = analyticsQuery.data
  const hasSubmittedDays = (summary?.totalReports ?? 0) > 0

  return (
    <ScrollView contentContainerStyle={styles.content}>
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

      {analyticsQuery.isPending ? (
        <LoadingScreen />
      ) : analyticsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading your analytics." />
      ) : !summary || summary.totalReports === 0 ? (
        <Text style={styles.mutedLine}>No Sadhana reports found for this range.</Text>
      ) : (
        <>
          <Card title="Rounds">
            <Sparkline
              data={summary.roundsChartData.map((point) => ({
                value: point.totalRounds,
                hasData: point.hasReport,
              }))}
            />
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{summary.totalRounds}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatAverage(summary.averageRoundsPerSubmittedDay, hasSubmittedDays, (v) =>
                    v.toFixed(1),
                  )}
                </Text>
                <Text style={styles.statLabel}>Avg / submitted day</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {Math.round(summary.completionRate * 100)}%
                </Text>
                <Text style={styles.statLabel}>
                  Completion ({summary.totalReports}/{summary.totalDays})
                </Text>
              </View>
            </View>
          </Card>

          <Card title="Study">
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatMinutes(summary.totalReadingMinutes)}</Text>
                <Text style={styles.statLabel}>Reading total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatAverage(
                    summary.averageReadingMinutesPerSubmittedDay,
                    hasSubmittedDays,
                    formatMinutes,
                  )}
                </Text>
                <Text style={styles.statLabel}>Reading avg/day</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatMinutes(summary.totalHearingMinutes)}</Text>
                <Text style={styles.statLabel}>Hearing total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatAverage(
                    summary.averageHearingMinutesPerSubmittedDay,
                    hasSubmittedDays,
                    formatMinutes,
                  )}
                </Text>
                <Text style={styles.statLabel}>Hearing avg/day</Text>
              </View>
            </View>
          </Card>

          <Card title="Rest">
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatMinutes(summary.totalDayRestMinutes)}</Text>
                <Text style={styles.statLabel}>Day rest total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatAverage(
                    summary.averageDayRestMinutesPerSubmittedDay,
                    hasSubmittedDays,
                    formatMinutes,
                  )}
                </Text>
                <Text style={styles.statLabel}>Day rest avg/day</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatMinutes(summary.totalRestMinutes)}</Text>
                <Text style={styles.statLabel}>Total rest total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatAverage(
                    summary.averageTotalRestMinutesPerSubmittedDay,
                    hasSubmittedDays,
                    formatMinutes,
                  )}
                </Text>
                <Text style={styles.statLabel}>Total rest avg/day</Text>
              </View>
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    stat: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    statLabel: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      textAlign: 'center',
    },
  })
}
