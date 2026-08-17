import { useRecentSadhanaReports } from '@/application/sadhana/use-recent-sadhana-reports'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { SadhanaReportSummaryRow } from '@/presentation/pages/sadhana/SadhanaReportSummaryRow'

const RECENT_REPORTS_DISPLAY_COUNT = 5

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
                  <SadhanaReportSummaryRow report={report} variant="compact" />
                </li>
              ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
