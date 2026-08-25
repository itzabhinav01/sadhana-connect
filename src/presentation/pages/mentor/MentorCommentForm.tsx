import { useState } from 'react'

import { COMMENT_MAX_LENGTH, commentSchema, useAddComment } from '@sadhana-connect/comments'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'

interface MentorCommentFormProps {
  sadhanaReportId: string
}

export function MentorCommentForm({ sadhanaReportId }: MentorCommentFormProps) {
  const [text, setText] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const addComment = useAddComment(sadhanaReportId)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = commentSchema.safeParse({ commentText: text })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Invalid comment.')
      return
    }
    setValidationError(null)
    addComment.mutate(result.data.commentText, {
      onSuccess: () => setText(''),
    })
  }

  const labelId = `mentor-comment-form-${sadhanaReportId}`

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={labelId} className="text-sm font-medium text-foreground">
        Add a comment
      </label>
      <Textarea
        id={labelId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        maxLength={COMMENT_MAX_LENGTH}
        placeholder="Write a note for this devotee's report…"
        aria-invalid={validationError ? true : undefined}
      />
      {validationError ? (
        <p className="text-xs text-destructive">{validationError}</p>
      ) : null}
      <Button
        type="submit"
        size="sm"
        disabled={addComment.isPending}
        className="self-start"
      >
        {addComment.isPending ? 'Posting…' : 'Post Comment'}
      </Button>
      {addComment.isError ? (
        <p className="text-xs text-destructive">
          Something went wrong posting your comment.
        </p>
      ) : null}
    </form>
  )
}
