import { Link } from 'react-router-dom'

import type { MentorDevoteeSummary } from '@sadhana-connect/mentor'
import { formatIsoDateLong } from '@sadhana-connect/shared'
import { Button } from '@/presentation/components/ui/button'

function formatDisplayDate(iso: string) {
  return formatIsoDateLong(iso)
}

function StatusBadge({ hasSubmittedYesterday }: { hasSubmittedYesterday: boolean }) {
  return (
    <span
      className={
        hasSubmittedYesterday
          ? 'rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
          : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
      }
    >
      {hasSubmittedYesterday ? 'Yesterday Logged' : 'Yesterday Pending'}
    </span>
  )
}

interface MentorDevoteeListProps {
  summaries: MentorDevoteeSummary[]
}

// Desktop table and mobile stacked cards render the same data from the
// same prop — toggled with responsive display classes, not separate data
// fetches or separate components with divergent logic.
export function MentorDevoteeList({ summaries }: MentorDevoteeListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Yesterday&apos;s Status</th>
              <th className="px-4 py-3 font-medium">Yesterday&apos;s Rounds</th>
              <th className="px-4 py-3 font-medium">Assigned Since</th>
              <th className="px-4 py-3 font-medium">Last Report</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {summaries.map((summary) => (
              <tr key={summary.devoteeId}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {summary.fullName}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge hasSubmittedYesterday={summary.hasSubmittedYesterday} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {summary.yesterdayTotalRounds ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDisplayDate(summary.assignedAt.slice(0, 10))}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {summary.lastReportDate
                     ? formatDisplayDate(summary.lastReportDate)
                    : 'No reports yet'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/mentor/devotee/${summary.devoteeId}`}>
                      View
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {summaries.map((summary) => (
          <li
            key={summary.devoteeId}
            className="flex flex-col gap-2 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                {summary.fullName}
              </span>
              <StatusBadge hasSubmittedYesterday={summary.hasSubmittedYesterday} />
            </div>
            <p className="text-sm text-muted-foreground">
              {summary.yesterdayTotalRounds !== null
                ? `${summary.yesterdayTotalRounds} rounds yesterday`
                : 'No report for yesterday'}
              {summary.hasSubmittedToday ? ` • Today: ${summary.todayTotalRounds} rounds` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Last report:{' '}
              {summary.lastReportDate
                ? formatDisplayDate(summary.lastReportDate)
                : 'No reports yet'}
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to={`/mentor/devotee/${summary.devoteeId}`}>
                View Report
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}
