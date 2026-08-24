import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  announcementCommentSchema,
  type AnnouncementCommentFormValues,
} from '@/application/announcements/announcement-comment-schema'
import { useAnnouncementComments } from '@/application/announcements/use-announcement-comments'
import { useCreateAnnouncementComment } from '@/application/announcements/use-create-announcement-comment'
import { useDeleteAnnouncementComment } from '@/application/announcements/use-delete-announcement-comment'
import { useUpdateAnnouncementComment } from '@/application/announcements/use-update-announcement-comment'
import { useAuth } from '@/application/auth/use-auth'
import { useProfile } from '@/application/profile/use-profile'
import type { AnnouncementComment } from '@sadhana-connect/domain/entities/announcement-comment'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

interface AnnouncementCommentsProps {
  announcementId: string
  // Needed for the mentor-moderation affordance: "moderate/delete comments
  // in announcements they manage" (section 9) — RLS
  // (announcement_comments_delete) is what actually enforces this, this
  // prop only decides whether the Delete button renders for a not-own
  // comment.
  announcementAuthorId: string | null
}

// Flat, non-nested Q&A (approved Phase 20A decision — no parentCommentId,
// no threaded replies). Any active profile that can see the announcement
// may post here (devotee asking a genuine question, or a mentor/admin
// replying) — RLS (announcement_comments_insert) is the real boundary;
// this component renders the same composer for every viewer and lets a
// denied INSERT simply surface as a mutation error.
export function AnnouncementComments({
  announcementId,
  announcementAuthorId,
}: AnnouncementCommentsProps) {
  const { session } = useAuth()
  const profile = useProfile()
  const currentUserId = session?.userId ?? null
  const isSuperAdmin = profile.data?.role === 'super_admin'
  const canModerate = isSuperAdmin || (announcementAuthorId !== null && announcementAuthorId === currentUserId)

  const commentsQuery = useAnnouncementComments(announcementId, true)
  const createComment = useCreateAnnouncementComment(announcementId)

  const form = useForm<AnnouncementCommentFormValues>({
    resolver: zodResolver(announcementCommentSchema),
    defaultValues: { commentText: '' },
  })

  function onSubmit(values: AnnouncementCommentFormValues) {
    createComment.mutate(values.commentText, { onSuccess: () => form.reset() })
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Questions &amp; comments</h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <label htmlFor="announcement-comment-text" className="sr-only">
          Ask a question or leave a comment
        </label>
        <Textarea
          id="announcement-comment-text"
          rows={3}
          placeholder="Ask a question or leave a comment…"
          aria-invalid={form.formState.errors.commentText ? true : undefined}
          {...form.register('commentText')}
        />
        {form.formState.errors.commentText ? (
          <p className="text-xs text-destructive">{form.formState.errors.commentText.message}</p>
        ) : null}
        <Button type="submit" size="sm" disabled={createComment.isPending} className="self-start">
          {createComment.isPending ? 'Posting…' : 'Post'}
        </Button>
        {createComment.isError ? (
          <p className="text-xs text-destructive">Something went wrong posting this comment.</p>
        ) : null}
      </form>

      {commentsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : null}
      {commentsQuery.isError ? (
        <p className="text-sm text-destructive">Something went wrong loading comments.</p>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions yet.</p>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {commentsQuery.data.map((comment) => (
            <AnnouncementCommentItem
              key={comment.id}
              comment={comment}
              announcementId={announcementId}
              isOwn={comment.authorId === currentUserId}
              canModerate={canModerate}
            />
          ))}
        </ul>
      ) : null}
    </div>
  )
}

interface AnnouncementCommentItemProps {
  comment: AnnouncementComment
  announcementId: string
  isOwn: boolean
  canModerate: boolean
}

function AnnouncementCommentItem({
  comment,
  announcementId,
  isOwn,
  canModerate,
}: AnnouncementCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(comment.commentText)
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateComment = useUpdateAnnouncementComment(announcementId)
  const deleteComment = useDeleteAnnouncementComment(announcementId)

  function handleSave() {
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
    <li className="rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{comment.authorName}</span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(comment.createdAt)}
          {comment.updatedAt !== comment.createdAt ? ' (edited)' : ''}
        </span>
      </div>

      {isEditing ? (
        <div className="mt-2 flex flex-col gap-2">
          <Textarea
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={2}
            aria-label="Edit comment"
          />
          {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={updateComment.isPending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setDraftText(comment.commentText)
                setValidationError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.commentText}</p>
      )}

      {!isEditing && (isOwn || canModerate) ? (
        <div className="mt-2 flex items-center gap-2">
          {isOwn ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => deleteComment.mutate(comment.id)}
            disabled={deleteComment.isPending}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </li>
  )
}
