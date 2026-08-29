import { zodResolver } from '@hookform/resolvers/zod'
import {
  announcementCommentSchema,
  useAnnouncementComments,
  useAnnouncements,
  useCreateAnnouncementComment,
  useDeleteAnnouncementComment,
  useUpdateAnnouncementComment,
  type AnnouncementCommentFormValues,
} from '@sadhana-connect/announcements'
import { useAuth, useProfile } from '@sadhana-connect/auth'
import type { AnnouncementComment } from '@sadhana-connect/domain'
import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../../src/application/theme/use-theme'
import { Button } from '../../../../src/presentation/components/Button'
import { fontFamily, fontSize, radius, spacing } from '../../../../src/shared/theme'
import type { ThemeColors } from '../../../../src/shared/theme'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString()
}

interface CommentItemProps {
  comment: AnnouncementComment
  announcementId: string
  isOwn: boolean
  canModerate: boolean
}

function CommentItem({ comment, announcementId, isOwn, canModerate }: CommentItemProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(comment.commentText)
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateComment = useUpdateAnnouncementComment(announcementId)
  const deleteComment = useDeleteAnnouncementComment(announcementId)

  const wasEdited = comment.updatedAt !== comment.createdAt

  const handleSave = () => {
    const result = announcementCommentSchema.safeParse({ commentText: draftText })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Invalid comment.')
      return
    }
    setValidationError(null)
    updateComment.mutate(
      { commentId: comment.id, commentText: result.data.commentText },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{comment.authorName}</Text>
        <Text style={styles.itemTimestamp}>
          {formatTimestamp(comment.createdAt)}
          {wasEdited ? ' (edited)' : ''}
        </Text>
      </View>

      {isEditing ? (
        <View style={styles.editBlock}>
          <TextInput
            style={styles.textArea}
            value={draftText}
            onChangeText={setDraftText}
            multiline
            accessibilityLabel="Edit comment"
          />
          {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
          <View style={styles.actionsRow}>
            <Button title="Save" isPending={updateComment.isPending} onPress={handleSave} />
            <Button
              title="Cancel"
              variant="text"
              onPress={() => {
                setIsEditing(false)
                setDraftText(comment.commentText)
                setValidationError(null)
              }}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.itemText}>{comment.commentText}</Text>
      )}

      {!isEditing && (isOwn || canModerate) ? (
        <View style={styles.actionsRow}>
          {isOwn ? (
            <Button title="Edit" variant="outline" onPress={() => setIsEditing(true)} />
          ) : null}
          <Button
            title="Delete"
            variant="destructive"
            isPending={deleteComment.isPending}
            onPress={() => deleteComment.mutate(comment.id)}
          />
        </View>
      ) : null}
    </View>
  )
}

function AnnouncementComments({
  announcementId,
  announcementAuthorId,
}: {
  announcementId: string
  announcementAuthorId: string | null
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { session } = useAuth()
  const profile = useProfile()
  const currentUserId = session?.userId ?? null
  const isSuperAdmin = profile.data?.role === 'super_admin'
  const canModerate =
    isSuperAdmin || (announcementAuthorId !== null && announcementAuthorId === currentUserId)

  const commentsQuery = useAnnouncementComments(announcementId, true)
  const createComment = useCreateAnnouncementComment(announcementId)

  const { control, handleSubmit, reset } = useForm<AnnouncementCommentFormValues>({
    resolver: zodResolver(announcementCommentSchema),
    defaultValues: { commentText: '' },
  })

  const onSubmit = handleSubmit((values) => {
    createComment.mutate(values.commentText, { onSuccess: () => reset() })
  })

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Questions & comments</Text>

      <Controller
        control={control}
        name="commentText"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.addForm}>
            <TextInput
              style={styles.textArea}
              value={value}
              onChangeText={onChange}
              multiline
              placeholder="Ask a question or leave a comment…"
              accessibilityLabel="Ask a question or leave a comment"
            />
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
            <Button
              title="Post"
              pendingTitle="Posting…"
              isPending={createComment.isPending}
              onPress={onSubmit}
            />
            {createComment.isError ? (
              <Text style={styles.errorText}>Something went wrong posting this comment.</Text>
            ) : null}
          </View>
        )}
      />

      {commentsQuery.isPending ? <Text style={styles.itemTimestamp}>Loading comments…</Text> : null}
      {commentsQuery.isError ? (
        <Text style={styles.errorText}>Something went wrong loading comments.</Text>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length === 0 ? (
        <Text style={styles.itemTimestamp}>No questions yet.</Text>
      ) : null}
      {commentsQuery.isSuccess
        ? commentsQuery.data.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              announcementId={announcementId}
              isOwn={comment.authorId === currentUserId}
              canModerate={canModerate}
            />
          ))
        : null}
    </View>
  )
}

// A missing announcement covers deleted, expired-and-purged, or
// never-visible-to-this-viewer identically on purpose — matches web's
// AnnouncementDetailPage, which reuses the same viewer-scoped
// useAnnouncements() query rather than a separate detail fetch.
export default function AnnouncementDetailScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { id } = useLocalSearchParams<{ id: string }>()
  const announcementsQuery = useAnnouncements()
  const announcement = announcementsQuery.data?.find((item) => item.id === id)

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {announcementsQuery.isPending ? <Text style={styles.mutedLine}>Loading…</Text> : null}

      {announcementsQuery.isError ? (
        <Text style={styles.errorLine}>
          Something went wrong loading this announcement. Please try again.
        </Text>
      ) : null}

      {announcementsQuery.isSuccess && !announcement ? (
        <Text style={styles.mutedLine}>This announcement is no longer available.</Text>
      ) : null}

      {announcement ? (
        <>
          <View style={styles.announcementCard}>
            <Text style={styles.title}>{announcement.title}</Text>
            <Text style={styles.body}>{announcement.content}</Text>
          </View>
          <AnnouncementComments
            announcementId={announcement.id}
            announcementAuthorId={announcement.authorId}
          />
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
    announcementCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    body: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    container: {
      gap: spacing.sm,
      backgroundColor: colors.mutedBackground,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
    heading: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    item: {
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    itemName: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    itemTimestamp: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    itemText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    editBlock: {
      gap: spacing.xs,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    errorText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.destructive,
    },
    addForm: {
      gap: spacing.xs,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      minHeight: 72,
      textAlignVertical: 'top',
    },
  })
}
