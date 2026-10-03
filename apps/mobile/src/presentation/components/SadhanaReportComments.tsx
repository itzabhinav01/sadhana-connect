import { useSadhanaReportComments } from '@sadhana-connect/comments'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString()
}

export function SadhanaReportComments({ sadhanaReportId }: { sadhanaReportId: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const commentsQuery = useSadhanaReportComments(sadhanaReportId, true)

  return (
    <View style={styles.container}>
      {commentsQuery.isPending ? (
        <Text style={styles.mutedText}>Loading comments…</Text>
      ) : null}
      {commentsQuery.isError ? (
        <Text style={styles.errorText}>Something went wrong loading comments.</Text>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length === 0 ? (
        <Text style={styles.mutedText}>No mentor comments yet.</Text>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length > 0
        ? commentsQuery.data.map((comment) => (
            <View key={comment.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.mentorName}>{comment.mentorName}</Text>
                <Text style={styles.timestamp}>
                  {formatTimestamp(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt ? ' (edited)' : ''}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.commentText}</Text>
            </View>
          ))
        : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
      backgroundColor: colors.mutedBackground,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    mutedText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    errorText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.destructive,
    },
    item: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    mentorName: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    timestamp: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    commentText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
  })
}
