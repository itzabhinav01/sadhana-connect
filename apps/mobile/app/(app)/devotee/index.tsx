import { useAnnouncements } from '@sadhana-connect/announcements'
import { useProfile } from '@sadhana-connect/auth'
import {
  buildWhatsAppShareUrl,
  useRecentSadhanaReports,
  useSadhanaReport,
  useSadhanaStreak,
  useWeeklySadhanaSummary,
} from '@sadhana-connect/sadhana'
import { formatVerseCitation, useVerseOfTheDay } from '@sadhana-connect/verse'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { useNavigation, useRouter } from 'expo-router'
import { useLayoutEffect, useMemo } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { Chip } from '../../../src/presentation/components/Chip'
import { AppUpdateSection } from '../../../src/presentation/components/AppUpdateSection'
import { HeaderThemeToggle } from '../../../src/presentation/components/HeaderThemeToggle'
import { Icon } from '../../../src/presentation/components/Icon'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { SadhanaReportRow } from '../../../src/presentation/components/SadhanaReportRow'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const RECENT_REPORTS_DISPLAY_COUNT = 3

function WeekStrip({ chartData, colors }: { chartData: { date: string; hasReport: boolean }[]; colors: ThemeColors }) {
  return (
    <View style={weekStripStyles.row}>
      {chartData.map((day) => (
        <View
          key={day.date}
          style={[
            weekStripStyles.dot,
            { backgroundColor: day.hasReport ? colors.primary : colors.mutedBackground },
          ]}
        />
      ))}
    </View>
  )
}

const weekStripStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  dot: { flex: 1, height: 8, borderRadius: radius.full },
})

export default function DashboardScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const signOut = useSignOut()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const today = getLocalDateIso()

  const todayReport = useSadhanaReport(today)
  const streak = useSadhanaStreak()
  const weeklySummary = useWeeklySadhanaSummary()
  const recentReports = useRecentSadhanaReports()
  const announcementsQuery = useAnnouncements()
  const verseQuery = useVerseOfTheDay()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  const profileQuery = useProfile()
  const userName = profileQuery.data?.fullName

  // The Home tab is the one screen in the tab bar that also shows Profile & Sign
  // Out in its header (every other tab just gets the ThemeToggle set at
  // the Tabs navigator level) — set via navigation.setOptions rather
  // than a <Stack.Screen> override, which only applies inside an actual
  // Stack navigator and is a no-op here now that this route is hosted by
  // a Tabs layout.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Button
            title="Profile"
            onPress={() => router.push('/profile')}
            variant="outline"
          />
          <HeaderThemeToggle />
          <Button
            title="Sign Out"
            pendingTitle="…"
            isPending={signOut.isPending}
            onPress={handleSignOut}
            variant="outline"
          />
        </View>
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSignOut is recreated every render but is stable in effect; re-running per signOut.isPending is what actually needs to trigger the re-render of the header button.
  }, [navigation, styles, signOut.isPending, router])

  if (todayReport.isPending) {
    return <LoadingScreen />
  }

  const report = todayReport.data
  const streakValue = streak.data ?? 0
  const latestAnnouncement = announcementsQuery.data?.[0]

  return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Hare Krishna{userName ? `, ${userName}` : ''} 🙏
          </Text>
          <Text style={styles.headerTitle}>
            {report ? "Today's sadhana is logged" : 'Your sadhana at a glance'}
          </Text>
        </View>

        <Card title="Today's Sadhana">
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <View style={styles.heroLabelRow}>
                <Icon
                  name={streakValue > 0 ? 'flame' : 'flame-outline'}
                  size={16}
                  color={streakValue > 0 ? colors.warning : colors.muted}
                />
                <Text style={styles.heroLabel}>Streak</Text>
              </View>
              <Text style={styles.heroValue}>
                {streakValue}
                <Text style={styles.heroUnit}> {streakValue === 1 ? 'day' : 'days'}</Text>
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroLabel}>Rounds today</Text>
              <Text style={styles.heroValue}>{report ? report.totalRounds : '—'}</Text>
            </View>
          </View>

          {report ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{report.readingMinutes}</Text>
                  <Text style={styles.statLabel}>Reading (min)</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{report.hearingMinutes}</Text>
                  <Text style={styles.statLabel}>Hearing (min)</Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                <Button
                  title="Edit Sadhana"
                  onPress={() => router.push({ pathname: '/devotee/sadhana', params: { date: today } })}
                  variant="outline"
                />
                <Button
                  title="Share to WhatsApp"
                  onPress={() => Linking.openURL(buildWhatsAppShareUrl(report))}
                  variant="outline"
                />
              </View>
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

        <Card title="Weekly Progress">
          {weeklySummary.data ? (
            <>
              <WeekStrip chartData={weeklySummary.data.chartData} colors={colors} />
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
            </>
          ) : (
            <Text style={styles.mutedLine}>Loading…</Text>
          )}
        </Card>

        <Card title="Recent Reports">
          {recentReports.data && recentReports.data.length > 0 ? (
            recentReports.data.slice(0, RECENT_REPORTS_DISPLAY_COUNT).map((report) => (
              <SadhanaReportRow key={report.id} report={report} />
            ))
          ) : (
            <Text style={styles.mutedLine}>No reports yet — your submissions will show up here.</Text>
          )}
          <Button title="View History" onPress={() => router.push('/devotee/history')} variant="text" />
        </Card>

        <Card title="Announcements">
          {latestAnnouncement ? (
            <>
              <View style={styles.announcementHeader}>
                <Text style={styles.announcementTitle}>{latestAnnouncement.title}</Text>
                {latestAnnouncement.isPinned ? <Chip label="Pinned" tone="accent" /> : null}
              </View>
              <Text style={styles.mutedLine} numberOfLines={2}>
                {latestAnnouncement.content}
              </Text>
            </>
          ) : (
            <Text style={styles.mutedLine}>No announcements yet.</Text>
          )}
          <Button title="View all" onPress={() => router.push('/devotee/announcements')} variant="text" />
        </Card>

        <Card title="Verse of the Day">
          {verseQuery.data ? (
            <>
              <Text style={styles.verseCitation}>{formatVerseCitation(verseQuery.data)}</Text>
              {verseQuery.data.content ? (
                <Text style={styles.mutedLine} numberOfLines={2}>
                  {verseQuery.data.content.translation}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.mutedLine}>Not available yet.</Text>
          )}
          <Button title="Read more" onPress={() => router.push('/devotee/verse')} variant="text" />
        </Card>

        <Card title="Settings & Reminders">
          <Text style={styles.mutedLine}>
            Manage your 9:00 PM daily sadhana reminder notification, appearance, and preferences.
          </Text>
          <Button
            title="Open Settings"
            variant="outline"
            onPress={() => router.push('/devotee/settings')}
          />
        </Card>

        <AppUpdateSection />
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    header: {
      gap: 2,
      paddingBottom: spacing.xs,
    },
    eyebrow: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
    headerTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroStat: {
      flex: 1,
      gap: 4,
    },
    heroDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
    heroLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    heroLabel: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      fontWeight: '500',
      color: colors.muted,
    },
    heroValue: {
      fontSize: fontSize.display,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    heroUnit: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      fontWeight: '500',
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
      fontSize: fontSize.xl,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    statLabel: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    announcementHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    announcementTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    verseCitation: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
  })
}
