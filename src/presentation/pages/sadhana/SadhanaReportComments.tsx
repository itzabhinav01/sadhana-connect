import { useSadhanaReportComments } from '@sadhana-connect/comments'

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

interface SadhanaReportCommentsProps {
  sadhanaReportId: string
}

// Read-only: a devotee can read mentor comments on their own reports, but
// this component has no input, edit, delete, or reply control anywhere —
// there is nothing here that could even attempt a mutation. RLS
// (sadhana_report_comments has no INSERT/UPDATE/DELETE policy for a
// devotee) is the actual boundary; this is simply the honest read-only
// rendering of what that boundary already allows.
export function SadhanaReportComments({
  sadhanaReportId,
}: SadhanaReportCommentsProps) {
  const commentsQuery = useSadhanaReportComments(sadhanaReportId, true)

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
      {commentsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : null}
      {commentsQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading comments.
        </p>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No mentor comments yet.</p>
      ) : null}
      {commentsQuery.isSuccess && commentsQuery.data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {commentsQuery.data.map((comment) => (
            <li key={comment.id} className="rounded-md border bg-background p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {comment.mentorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt ? ' (edited)' : ''}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {comment.commentText}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
