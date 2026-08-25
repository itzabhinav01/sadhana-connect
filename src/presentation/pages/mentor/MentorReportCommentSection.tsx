import { useSadhanaReportComments } from '@sadhana-connect/comments'
import { MentorCommentForm } from '@/presentation/pages/mentor/MentorCommentForm'
import { MentorCommentList } from '@/presentation/pages/mentor/MentorCommentList'

interface MentorReportCommentSectionProps {
  sadhanaReportId: string
}

// Only rendered once a report row is expanded (see
// MentorDevoteeReportRow) — the comment query is lazy-loaded here, never
// prefetched for every report in a list.
export function MentorReportCommentSection({
  sadhanaReportId,
}: MentorReportCommentSectionProps) {
  const commentsQuery = useSadhanaReportComments(sadhanaReportId, true)

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
      {commentsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : null}
      {commentsQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading comments.
        </p>
      ) : null}
      {commentsQuery.isSuccess ? (
        <MentorCommentList
          comments={commentsQuery.data}
          sadhanaReportId={sadhanaReportId}
        />
      ) : null}
      <MentorCommentForm sadhanaReportId={sadhanaReportId} />
    </div>
  )
}
