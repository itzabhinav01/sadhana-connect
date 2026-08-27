import { useAdminUsers, useMentorDevoteeCounts } from '@sadhana-connect/admin'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '../../../src/presentation/components/Button'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { colors, fontSize, spacing } from '../../../src/shared/theme'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

// A filtered view of the shared user-management architecture — same
// useAdminUsers hook as /admin/users, pre-filtered to role: 'mentor',
// not a parallel system. Mirrors web's AdminMentorsPage.
export default function AdminMentorsScreen() {
  const router = useRouter()
  const mentorsQuery = useAdminUsers({ role: 'mentor' })
  const countsQuery = useMentorDevoteeCounts()

  const mentors = mentorsQuery.data?.pages.flatMap((page) => page.users) ?? []
  const countByMentorId = new Map(
    (countsQuery.data ?? []).map((count) => [count.mentorId, count.activeDevoteeCount]),
  )

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {mentorsQuery.isPending || countsQuery.isPending ? (
        <Text style={styles.mutedLine}>Loading…</Text>
      ) : null}

      {mentorsQuery.isError || countsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading mentors." />
      ) : null}

      {mentorsQuery.isSuccess && mentors.length === 0 ? (
        <Text style={styles.mutedLine}>No mentors yet.</Text>
      ) : null}

      {mentors.map((mentor) => (
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
  badgeActive: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  badgeDisabled: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.muted,
  },
})
