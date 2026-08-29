import type { Announcement } from '@sadhana-connect/domain'
import { useAnnouncements } from '@sadhana-connect/announcements'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Chip } from '../../../src/presentation/components/Chip'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function AnnouncementFeedCard({ announcement }: { announcement: Announcement }) {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={() => router.push(`/devotee/announcements/${announcement.id}`)}
      accessibilityRole="button"
      accessibilityLabel={announcement.title}
      style={styles.card}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{announcement.title}</Text>
        {announcement.isPinned ? <Chip label="Pinned" tone="accent" /> : null}
      </View>
      <Text style={styles.cardContent} numberOfLines={3}>
        {announcement.content}
      </Text>
      <Text style={styles.mutedLine}>
        {announcement.publishedAt
          ? `Published ${formatDisplayDate(announcement.publishedAt)}`
          : `Created ${formatDisplayDate(announcement.createdAt)}`}
      </Text>
    </Pressable>
  )
}

// Devotee-facing community feed — mirrors web's AnnouncementsFeedPage.
// Reuses useAnnouncements() as-is: announcements_select already returns
// exactly what this viewer may see, pinned-first then newest first, so
// this screen adds no client-side filtering/sorting of its own.
export default function AnnouncementsFeedScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const announcementsQuery = useAnnouncements()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {announcementsQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}

      {announcementsQuery.isError ? (
        <Text style={styles.errorLine}>Something went wrong loading announcements.</Text>
      ) : null}

      {announcementsQuery.isSuccess && announcementsQuery.data.length === 0 ? (
        <Text style={styles.mutedLine}>No announcements yet.</Text>
      ) : null}

      {announcementsQuery.isSuccess
        ? announcementsQuery.data.map((announcement) => (
            <AnnouncementFeedCard key={announcement.id} announcement={announcement} />
          ))
        : null}
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
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    errorLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.destructive,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    cardTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    cardContent: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
  })
}
