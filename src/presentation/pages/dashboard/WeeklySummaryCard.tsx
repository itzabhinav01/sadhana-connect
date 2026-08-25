import { useWeeklySadhanaSummary } from '@sadhana-connect/sadhana'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

function formatDateRange(startIso: string, endIso: string) {
  const format = (iso: string) => {
    const [, month, day] = iso.split('-')
    return `${month}/${day}`
  }
  return `${format(startIso)} – ${format(endIso)}`
}

export function WeeklySummaryCard() {
  const summaryQuery = useWeeklySadhanaSummary()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>This Week</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summaryQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {summaryQuery.isError ? (
          <p className="text-sm text-destructive">
            Something went wrong loading this week&apos;s summary.
          </p>
        ) : null}

        {summaryQuery.data ? (
          <dl className="grid grid-cols-2 gap-4">
            <div className="col-span-2 text-xs text-muted-foreground">
              {formatDateRange(
                summaryQuery.data.startDate,
                summaryQuery.data.endDate,
              )}
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reports</dt>
              <dd className="text-lg font-semibold text-foreground">
                {summaryQuery.data.totalReports} / 7
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Completion</dt>
              <dd className="text-lg font-semibold text-foreground">
                {Math.round(summaryQuery.data.completionRate * 100)}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Avg Rounds</dt>
              <dd className="text-lg font-semibold text-foreground">
                {summaryQuery.data.totalReports === 0
                  ? '—'
                  : summaryQuery.data.averageTotalRounds.toFixed(1)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reading</dt>
              <dd className="text-lg font-semibold text-foreground">
                {summaryQuery.data.totalReadingMinutes} min
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Hearing</dt>
              <dd className="text-lg font-semibold text-foreground">
                {summaryQuery.data.totalHearingMinutes} min
              </dd>
            </div>
          </dl>
        ) : null}
      </CardContent>
    </Card>
  )
}
