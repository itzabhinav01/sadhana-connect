import { filterMentorDevotees, useMentorDevotees, type MentorDevoteeSummary } from '@sadhana-connect/mentor'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

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
      <Text style={styles.rowName}>{summary.fullName}</Text>
      <Text style={styles.rowMuted}>
        Last report:{' '}
        {summary.lastReportDate ? formatDisplayDate(summary.lastReportDate) : 'No reports yet'}
      </Text>
    </Pressable>
  )
}

// A slim, single-purpose view of the same "pending today" filter already
// offered on the Devotees tab (see mentor/index.tsx's filter row) — its
// own tab per the approved navigation redesign, not a new data source:
// same useMentorDevotees() query, same filterMentorDevotees() logic.
export default function MentorPendingScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [search, setSearch] = useState('')
  const devoteesQuery = useMentorDevotees()

  if (devoteesQuery.isPending) {
    return <LoadingScreen />
  }

  const summaries = devoteesQuery.data ?? []
  const pending = filterMentorDevotees(summaries, 'pending')
  const searchTerm = search.trim().toLowerCase()
  const visible = searchTerm
    ? pending.filter((summary) => summary.fullName.toLowerCase().includes(searchTerm))
    : pending

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {devoteesQuery.isError ? (
        <ErrorBanner message="Something went wrong loading your devotees. Please try again." />
      ) : null}

      {devoteesQuery.isSuccess && summaries.length === 0 ? (
        <Text style={styles.rowMuted}>No devotees are currently assigned to you.</Text>
      ) : null}

      {devoteesQuery.isSuccess && summaries.length > 0 ? (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            accessibilityLabel="Search devotees by name"
          />

          {pending.length === 0 ? (
            <Text style={styles.rowMuted}>Everyone has submitted today.</Text>
          ) : visible.length === 0 ? (
            <Text style={styles.rowMuted}>No devotees match this search.</Text>
          ) : (
            visible.map((summary) => <DevoteeSummaryRow key={summary.devoteeId} summary={summary} />)
          )}
        </>
      ) : null}
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
  })
}
