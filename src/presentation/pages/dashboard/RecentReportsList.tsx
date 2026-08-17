import { Link } from 'react-router-dom'

import { useRecentSadhanaReports } from '@/application/sadhana/use-recent-sadhana-reports'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

const RECENT_REPORTS_DISPLAY_COUNT = 5

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

export function RecentReportsList() {
  // Same query (same key/limit) as useSadhanaStreak — TanStack Query
  // dedupes this into a single request when both are on the page.
  const recentQuery = useRecentSadhanaReports()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Recent Reports</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {recentQuery.isError ? (
          <p className="text-sm text-destructive">
            Something went wrong loading recent reports.
          </p>
        ) : null}

        {recentQuery.data && recentQuery.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reports yet — your submissions will show up here.
          </p>
        ) : null}

        {recentQuery.data && recentQuery.data.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {recentQuery.data
              .slice(0, RECENT_REPORTS_DISPLAY_COUNT)
              .map((report) => (
                <li key={report.id}>
                  <Link
                    to={`/sadhana?date=${report.reportDate}`}
                    className="flex items-center justify-between rounded-sm py-2 text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>{formatDisplayDate(report.reportDate)}</span>
                    <span className="text-muted-foreground">
                      {report.totalRounds} rounds
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
