import { useState } from 'react'

import type { SadhanaReportHistoryEntry } from '@sadhana-connect/domain/entities/sadhana-report'
import { formatIsoDateLong } from '@sadhana-connect/shared'
import { MentorReportCommentSection } from '@/presentation/pages/mentor/MentorReportCommentSection'

function formatDisplayDate(iso: string) {
  return formatIsoDateLong(iso)
}

interface MentorDevoteeReportRowProps {
  // Narrowed (Phase 20B) to exactly the fields this row reads — it never
  // used anything beyond these five even when the prop was typed as the
  // full SadhanaReport, so this is a strictly honest narrowing, not a
  // behavior change. A full SadhanaReport still satisfies this
  // structurally, so every existing caller (today's report, recent
  // reports) is unaffected.
  report: SadhanaReportHistoryEntry
}

// The report content itself is deliberately not a link — SadhanaReportSummaryRow
// (used on the devotee's own dashboard/history) navigates to
// /sadhana?date=..., which is the EDIT form for the currently signed-in
// user. Reusing it here would silently send the mentor to their own
// Sadhana form instead of showing the devotee's report. Mentors are
// read-only for report content in this phase — the only interactive
// element on this row is the comments disclosure toggle, which reveals a
// separate, lazily-loaded comment thread and never touches the report
// fields themselves.
export function MentorDevoteeReportRow({ report }: MentorDevoteeReportRowProps) {
  const [showComments, setShowComments] = useState(false)
  const dateLabel = formatDisplayDate(report.reportDate)

  return (
    <div className="flex flex-col gap-2 py-2 text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{dateLabel}</span>
        <span className="text-muted-foreground">
          {report.totalRounds} rounds · {report.readingMinutes}m reading ·{' '}
          {report.hearingMinutes}m hearing
        </span>
      </div>
      <button
        type="button"
        onClick={() => setShowComments((current) => !current)}
        aria-expanded={showComments}
        aria-label={`${showComments ? 'Hide' : 'Show'} comments for ${dateLabel}`}
        className="self-start rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        {showComments ? 'Hide comments' : 'Comments'}
      </button>
      {showComments ? (
        <MentorReportCommentSection sadhanaReportId={report.id} />
      ) : null}
    </div>
  )
}
