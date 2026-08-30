import {
  MENTOR_DEVOTEE_FILTERS,
  filterMentorDevotees,
  useMentorDevotees,
  type MentorDevoteeFilter,
  type MentorDevoteeSummary,
} from '@sadhana-connect/mentor'
import { useProfile } from '@sadhana-connect/auth'
import { useNavigation, useRouter } from 'expo-router'
import { useLayoutEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { HeaderThemeToggle } from '../../../src/presentation/components/HeaderThemeToggle'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const FILTER_LABELS: Record<MentorDevoteeFilter, string> = {
  all: 'All',
  submitted: 'Submitted Yesterday',
  pending: 'Pending Yesterday',
}

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function DevoteeSummaryRow({ summary }: { summary: MentorDevoteeSummary }) {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={() => router.push(`/mentor/devotee/${summary.devoteeId}`)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`View ${summary.fullName}`}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowName}>{summary.fullName}</Text>
        <Text style={summary.hasSubmittedYesterday ? styles.badgeSubmitted : styles.badgePending}>
          {summary.hasSubmittedYesterday ? 'Yesterday Logged' : 'Yesterday Pending'}
        </Text>
      </View>
      <Text style={styles.rowMuted}>
        {summary.yesterdayTotalRounds !== null
          ? `${summary.yesterdayTotalRounds} rounds yesterday`
          : 'No report for yesterday'}
        {summary.hasSubmittedToday ? ` • Today: ${summary.todayTotalRounds} rounds` : ''}
      </Text>
      <Text style={styles.rowMuted}>
        Last report:{' '}
        {summary.lastReportDate ? formatDisplayDate(summary.lastReportDate) : 'No reports yet'}
      </Text>
    </Pressable>
  )
}

export default function MentorDashboardScreen() {
  const signOut = useSignOut()
  const router = useRouter()
  const navigation = useNavigation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [filter, setFilter] = useState<MentorDevoteeFilter>('all')
  const [search, setSearch] = useState('')

  const devoteesQuery = useMentorDevotees()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

  const profile = useProfile()
  const userName = profile.data?.fullName

  // The Devotees tab is the one screen that also shows Profile & Sign Out in its
  // header (every other tab just gets the ThemeToggle set at the Tabs
  // navigator level) — set via navigation.setOptions rather than a
  // <Stack.Screen> override, which only applies inside an actual Stack
  // navigator and is a no-op here now that this route is hosted by a
  // Tabs layout.
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

  if (devoteesQuery.isPending) {
    return <LoadingScreen />
  }

  const summaries = devoteesQuery.data ?? []
  const statusFiltered = filterMentorDevotees(summaries, filter)
  const searchTerm = search.trim().toLowerCase()
  const visibleSummaries = searchTerm
    ? statusFiltered.filter((summary) => summary.fullName.toLowerCase().includes(searchTerm))
    : statusFiltered

  const totalAssigned = summaries.length
  const submittedYesterday = summaries.filter((summary) => summary.hasSubmittedYesterday).length
  const pendingYesterday = totalAssigned - submittedYesterday

  return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Hare Krishna{userName ? `, ${userName}` : ''} (Mentor) 🙏
          </Text>
          <Text style={styles.headerTitle}>Your devotees at a glance</Text>
        </View>

        {devoteesQuery.isError ? (
          <ErrorBanner message="Something went wrong loading your devotees. Please try again." />
        ) : null}

        {devoteesQuery.isSuccess && summaries.length === 0 ? (
          <Text style={styles.rowMuted}>No devotees are currently assigned to you.</Text>
        ) : null}

        {devoteesQuery.isSuccess && summaries.length > 0 ? (
          <>
            <Card title="Overview">
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{totalAssigned}</Text>
                  <Text style={styles.rowMuted}>Total Assigned</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{submittedYesterday}</Text>
                  <Text style={styles.rowMuted}>Submitted Yesterday</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{pendingYesterday}</Text>
                  <Text style={styles.rowMuted}>Pending Yesterday</Text>
                </View>
              </View>
            </Card>

            <View style={styles.filterRow}>
              {MENTOR_DEVOTEE_FILTERS.map((option) => (
                <Button
                  key={option}
                  title={FILTER_LABELS[option]}
                  variant={filter === option ? 'primary' : 'outline'}
                  onPress={() => setFilter(option)}
                />
              ))}
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search by name"
              placeholderTextColor={colors.placeholder ?? colors.muted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              accessibilityLabel="Search devotees by name"
            />

            {visibleSummaries.length === 0 ? (
              <Text style={styles.rowMuted}>No devotees match this filter.</Text>
            ) : (
              visibleSummaries.map((summary) => (
                <DevoteeSummaryRow key={summary.devoteeId} summary={summary} />
              ))
            )}
          </>
        ) : null}

        <Button
          title="Announcements"
          variant="outline"
          onPress={() => router.push('/mentor/announcements')}
        />
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
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    row: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowName: {
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    rowMuted: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    badgeSubmitted: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.success,
    },
    badgePending: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.warning,
    },
  })
}
