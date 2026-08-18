import type { SadhanaReport } from '@/domain/entities/sadhana-report'

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

interface MentorDevoteeReportRowProps {
  report: SadhanaReport
}

// Deliberately not a link — SadhanaReportSummaryRow (used on the
// devotee's own dashboard/history) navigates to /sadhana?date=..., which
// is the EDIT form for the currently signed-in user. Reusing it here
// would silently send the mentor to their own Sadhana form instead of
// showing the devotee's report. Mentors are read-only in this phase, so
// this row is static, non-interactive display only.
export function MentorDevoteeReportRow({ report }: MentorDevoteeReportRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="font-medium text-foreground">
        {formatDisplayDate(report.reportDate)}
      </span>
      <span className="text-muted-foreground">
        {report.totalRounds} rounds · {report.readingMinutes}m reading ·{' '}
        {report.hearingMinutes}m hearing
      </span>
    </div>
  )
}
