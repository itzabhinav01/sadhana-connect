import { useState } from 'react'

import { commentSchema } from '@/application/comments/comment-schema'
import { useAuth } from '@sadhana-connect/auth'
import { useDeleteComment } from '@/application/comments/use-delete-comment'
import { useUpdateComment } from '@/application/comments/use-update-comment'
import type { SadhanaReportComment } from '@sadhana-connect/domain/entities/sadhana-report-comment'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

interface MentorCommentListProps {
  comments: SadhanaReportComment[]
  sadhanaReportId: string
}

export function MentorCommentList({
  comments,
  sadhanaReportId,
}: MentorCommentListProps) {
  const { session } = useAuth()
  const currentUserId = session?.userId ?? null

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {comments.map((comment) => (
        <li key={comment.id}>
          <MentorCommentItem
            comment={comment}
            sadhanaReportId={sadhanaReportId}
            // UI convenience only, matching the mentor-side own-comment
            // pattern established elsewhere — RLS
            // (sadhana_report_comments_update/_delete) is the actual
            // boundary that would reject an edit/delete attempt on
            // another mentor's comment regardless of this check.
            isOwnComment={comment.mentorId === currentUserId}
          />
        </li>
      ))}
    </ul>
  )
}

interface MentorCommentItemProps {
  comment: SadhanaReportComment
  sadhanaReportId: string
  isOwnComment: boolean
}

function MentorCommentItem({
  comment,
  sadhanaReportId,
  isOwnComment,
}: MentorCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draftText, setDraftText] = useState(comment.commentText)
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateComment = useUpdateComment(sadhanaReportId)
  const deleteComment = useDeleteComment(sadhanaReportId)

  function handleSave() {
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

  function handleCancelEdit() {
    setIsEditing(false)
    setDraftText(comment.commentText)
    setValidationError(null)
  }

  const wasEdited = comment.updatedAt !== comment.createdAt

  return (
    <div className="flex flex-col gap-1 rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {comment.mentorName}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(comment.createdAt)}
          {wasEdited ? ' (edited)' : ''}
        </span>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={3}
            aria-label="Edit comment"
          />
          {validationError ? (
            <p className="text-xs text-destructive">{validationError}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateComment.isPending}
            >
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {comment.commentText}
        </p>
      )}

      {isOwnComment && !isEditing ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          {confirmingDelete ? (
            <>
              <span className="text-xs text-muted-foreground">
                Delete this comment?
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => deleteComment.mutate(comment.id)}
                disabled={deleteComment.isPending}
              >
                Confirm
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
