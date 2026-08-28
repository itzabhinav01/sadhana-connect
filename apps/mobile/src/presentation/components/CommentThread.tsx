import { useAuth } from '@sadhana-connect/auth'
import {
  commentSchema,
  useAddComment,
  useDeleteComment,
  useSadhanaReportComments,
  useUpdateComment,
} from '@sadhana-connect/comments'
import type { SadhanaReportComment } from '@sadhana-connect/domain'
import { useMemo, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { Button } from './Button'
import { ErrorBanner } from './ErrorBanner'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString()
}

interface CommentItemProps {
  comment: SadhanaReportComment
  sadhanaReportId: string
  isOwnComment: boolean
}

function CommentItem({ comment, sadhanaReportId, isOwnComment }: CommentItemProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draftText, setDraftText] = useState(comment.commentText)
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateComment = useUpdateComment(sadhanaReportId)
  const deleteComment = useDeleteComment(sadhanaReportId)

  const wasEdited = comment.updatedAt !== comment.createdAt

  const handleSave = () => {
    const result = commentSchema.safeParse({ commentText: draftText })
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

  const handleCancelEdit = () => {
    setIsEditing(false)
    setDraftText(comment.commentText)
    setValidationError(null)
  }

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{comment.mentorName}</Text>
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
            <Button title="Cancel" variant="outline" onPress={handleCancelEdit} />
          </View>
        </View>
      ) : (
        <Text style={styles.itemText}>{comment.commentText}</Text>
      )}

      {isOwnComment && !isEditing ? (
        <View style={styles.actionsRow}>
          <Button title="Edit" variant="outline" onPress={() => setIsEditing(true)} />
          {confirmingDelete ? (
            <>
              <Text style={styles.itemTimestamp}>Delete this comment?</Text>
              <Button
                title="Confirm"
                variant="outline"
                isPending={deleteComment.isPending}
                onPress={() => deleteComment.mutate(comment.id)}
              />
              <Button title="Cancel" variant="outline" onPress={() => setConfirmingDelete(false)} />
            </>
          ) : (
            <Button title="Delete" variant="outline" onPress={() => setConfirmingDelete(true)} />
          )}
        </View>
      ) : null}
    </View>
  )
}

export function CommentThread({ sadhanaReportId }: { sadhanaReportId: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const commentsQuery = useSadhanaReportComments(sadhanaReportId, true)
  const { session } = useAuth()
  const currentUserId = session?.userId ?? null

  const [text, setText] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const addComment = useAddComment(sadhanaReportId)

  const handleSubmit = () => {
    const result = commentSchema.safeParse({ commentText: text })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Invalid comment.')
      return
    }
    setValidationError(null)
    addComment.mutate(result.data.commentText, { onSuccess: () => setText('') })
  }

  return (
    <View style={styles.container}>
      {commentsQuery.isPending ? (
        <Text style={styles.itemTimestamp}>Loading comments…</Text>
      ) : null}
      {commentsQuery.isError ? (
        <ErrorBanner message="Something went wrong loading comments." />
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length === 0 ? (
        <Text style={styles.itemTimestamp}>No comments yet.</Text>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length > 0
        ? commentsQuery.data.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              sadhanaReportId={sadhanaReportId}
              isOwnComment={comment.mentorId === currentUserId}
            />
          ))
        : null}

      <View style={styles.addForm}>
        <TextInput
          style={styles.textArea}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Write a note for this devotee's report…"
          accessibilityLabel="Add a comment"
        />
        {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
        <Button
          title="Post Comment"
          pendingTitle="Posting…"
          isPending={addComment.isPending}
          onPress={handleSubmit}
        />
        {addComment.isError ? (
          <Text style={styles.errorText}>Something went wrong posting your comment.</Text>
        ) : null}
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
      backgroundColor: colors.mutedBackground,
      borderRadius: 8,
      padding: spacing.sm,
    },
    item: {
      backgroundColor: colors.background,
      borderRadius: 8,
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
      color: colors.foreground,
    },
    itemTimestamp: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    itemText: {
      fontSize: fontSize.base,
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
      color: colors.destructive,
    },
    addForm: {
      gap: spacing.xs,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      color: colors.foreground,
      minHeight: 72,
      textAlignVertical: 'top',
    },
  })
}
