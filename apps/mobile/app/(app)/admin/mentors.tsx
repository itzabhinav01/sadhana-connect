import { useAdminUsers, useMentorDevoteeCounts } from '@sadhana-connect/admin'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

// A filtered view of the shared user-management architecture — same
// useAdminUsers hook as /admin/users, pre-filtered to role: 'mentor',
// not a parallel system. Mirrors web's AdminMentorsPage.
export default function AdminMentorsScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [search, setSearch] = useState('')
  const mentorsQuery = useAdminUsers({ role: 'mentor' })
  const countsQuery = useMentorDevoteeCounts()

  const mentors = mentorsQuery.data?.pages.flatMap((page) => page.users) ?? []
  const searchTerm = search.trim().toLowerCase()
  const visibleMentors = searchTerm
    ? mentors.filter((mentor) => mentor.fullName.toLowerCase().includes(searchTerm))
    : mentors
  const countByMentorId = new Map(
    (countsQuery.data ?? []).map((count) => [count.mentorId, count.activeDevoteeCount]),
  )

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {mentorsQuery.isPending || countsQuery.isPending ? (
        <Text style={styles.mutedLine}>Loading…</Text>
      ) : null}

      {mentorsQuery.isError || countsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading mentors." />
      ) : null}

      {mentorsQuery.isSuccess && mentors.length === 0 ? (
        <Text style={styles.mutedLine}>No mentors yet.</Text>
      ) : null}

      {mentors.length > 0 ? (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="Search mentors by name…"
            placeholderTextColor={colors.placeholder ?? colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            accessibilityLabel="Search mentors by name"
          />
          {visibleMentors.length === 0 ? (
            <Text style={styles.mutedLine}>No mentors match this search.</Text>
          ) : null}
        </>
      ) : null}

      {visibleMentors.map((mentor) => (
        <Pressable
          key={mentor.id}
          onPress={() => router.push(`/admin/users/${mentor.id}`)}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel={`View ${mentor.fullName}`}
        >
          <View style={styles.rowHeader}>
            <Text style={styles.rowName}>{mentor.fullName}</Text>
            <Text style={mentor.isActive ? styles.badgeActive : styles.badgeDisabled}>
              {mentor.isActive ? 'Active' : 'Disabled'}
            </Text>
          </View>
          <Text style={styles.mutedLine}>
            {countByMentorId.get(mentor.id) ?? 0} active devotees
          </Text>
          <Text style={styles.mutedLine}>Joined {formatDate(mentor.createdAt)}</Text>
        </Pressable>
      ))}

      {mentorsQuery.hasNextPage ? (
        <Button
          title="Load more"
          pendingTitle="Loading…"
          isPending={mentorsQuery.isFetchingNextPage}
          variant="outline"
          onPress={() => mentorsQuery.fetchNextPage()}
        />
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
    mutedLine: {
      fontSize: fontSize.sm,
      color: colors.muted,
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
    badgeActive: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
    },
    badgeDisabled: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.muted,
    },
  })
}
