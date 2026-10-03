import {
  extractMentorDevoteeGroups,
  filterMentorDevotees,
  filterMentorDevoteesByGroup,
  useMentorDevotees,
  type MentorDevoteeSummary,
  type MentorGroupFilter,
} from '@sadhana-connect/mentor'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

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
  const groups = summary.templeGroups ?? []

  return (
    <Pressable
      onPress={() => router.push(`/mentor/devotee/${summary.devoteeId}`)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`View ${summary.fullName}`}
    >
      <Text style={styles.rowName}>{summary.fullName}</Text>
      {groups.length > 0 ? (
        <View style={styles.groupBadgeRow}>
          {groups.map((group) => (
            <View key={group.id} style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>{group.name}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
  const [groupFilter, setGroupFilter] = useState<MentorGroupFilter>('all')
  const [search, setSearch] = useState('')
  const devoteesQuery = useMentorDevotees()

  if (devoteesQuery.isPending) {
    return <LoadingScreen />
  }

  const summaries = devoteesQuery.data ?? []
  const groupOptions = extractMentorDevoteeGroups(summaries)
  const ungroupedCount = summaries.filter((s) => (s.templeGroups ?? []).length === 0).length
  const groupFiltered = filterMentorDevoteesByGroup(summaries, groupFilter)
  const pending = filterMentorDevotees(groupFiltered, 'pending')
  const searchTerm = search.trim().toLowerCase()
  const visible = searchTerm
    ? pending.filter((summary) => summary.fullName.toLowerCase().includes(searchTerm))
    : pending

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {devoteesQuery.isError ? (
        <ErrorBanner message="Something went wrong loading your devotees. Please try again." />
      ) : null}

      {devoteesQuery.isSuccess && summaries.length === 0 ? (
        <Text style={styles.rowMuted}>No devotees are currently assigned to you.</Text>
      ) : null}

      {devoteesQuery.isSuccess && summaries.length > 0 ? (
        <>
          {groupOptions.length > 0 ? (
            <View style={styles.chipWrap}>
              <Pressable
                onPress={() => setGroupFilter('all')}
                style={[styles.chip, groupFilter === 'all' ? styles.chipSelected : null]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.chipText,
                    groupFilter === 'all' ? styles.chipTextSelected : null,
                  ]}
                >
                  All Groups ({summaries.length})
                </Text>
              </Pressable>
              {groupOptions.map((group) => {
                const isSelected = groupFilter === group.id
                return (
                  <Pressable
                    key={group.id}
                    onPress={() => setGroupFilter(group.id)}
                    style={[styles.chip, isSelected ? styles.chipSelected : null]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}
                    >
                      {group.name} ({group.count})
                    </Text>
                  </Pressable>
                )
              })}
              {ungroupedCount > 0 ? (
                <Pressable
                  onPress={() => setGroupFilter('ungrouped')}
                  style={[styles.chip, groupFilter === 'ungrouped' ? styles.chipSelected : null]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.chipText,
                      groupFilter === 'ungrouped' ? styles.chipTextSelected : null,
                    ]}
                  >
                    Ungrouped ({ungroupedCount})
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            placeholderTextColor={colors.placeholder ?? colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            accessibilityLabel="Search devotees by name"
          />

          {pending.length === 0 ? (
            <Text style={styles.rowMuted}>Everyone has submitted yesterday&apos;s sadhana.</Text>
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
      flexGrow: 1,
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chipText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    chipTextSelected: {
      color: colors.primary,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
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
      gap: 4,
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
    groupBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginVertical: 2,
    },
    groupBadge: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderWidth: 0.5,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    groupBadgeText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.primary,
    },
    rowMuted: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
  })
}
