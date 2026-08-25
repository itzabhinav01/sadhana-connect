import {
  MENTOR_DEVOTEE_FILTERS,
  filterMentorDevotees,
  useMentorDevotees,
  type MentorDevoteeFilter,
  type MentorDevoteeSummary,
} from '@sadhana-connect/mentor'
import { Stack, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { colors, fontSize, spacing } from '../../../src/shared/theme'

const FILTER_LABELS: Record<MentorDevoteeFilter, string> = {
  all: 'All',
  submitted: 'Submitted Today',
  pending: 'Pending Today',
}

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function DevoteeSummaryRow({ summary }: { summary: MentorDevoteeSummary }) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push(`/mentor/devotee/${summary.devoteeId}`)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`View ${summary.fullName}`}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowName}>{summary.fullName}</Text>
        <Text style={summary.hasSubmittedToday ? styles.badgeSubmitted : styles.badgePending}>
          {summary.hasSubmittedToday ? 'Submitted' : 'Pending'}
        </Text>
      </View>
      <Text style={styles.rowMuted}>
        {summary.todayTotalRounds !== null
          ? `${summary.todayTotalRounds} rounds today`
          : 'No rounds submitted today'}
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
  const [filter, setFilter] = useState<MentorDevoteeFilter>('all')
  const [search, setSearch] = useState('')

  const devoteesQuery = useMentorDevotees()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    })
  }

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
  const submittedToday = summaries.filter((summary) => summary.hasSubmittedToday).length
  const pendingToday = totalAssigned - submittedToday

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
                  <Text style={styles.statValue}>{submittedToday}</Text>
                  <Text style={styles.rowMuted}>Submitted Today</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{pendingToday}</Text>
                  <Text style={styles.rowMuted}>Pending Today</Text>
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
    </>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
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
    color: colors.foreground,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
  },
  rowMuted: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  badgeSubmitted: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  badgePending: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.muted,
  },
})
