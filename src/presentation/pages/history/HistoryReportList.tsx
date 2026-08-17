import { Link } from 'react-router-dom'

import { useSadhanaHistory } from '@/application/sadhana/use-sadhana-history'
import { Button } from '@/presentation/components/ui/button'
import { SadhanaReportSummaryRow } from '@/presentation/pages/sadhana/SadhanaReportSummaryRow'

interface HistoryReportListProps {
  fromDate?: string
  toDate?: string
}

export function HistoryReportList({ fromDate, toDate }: HistoryReportListProps) {
  const historyQuery = useSadhanaHistory({ fromDate, toDate })

  const reports = historyQuery.data?.pages.flatMap((page) => page.reports) ?? []

  return (
    <div className="flex flex-col gap-4">
      {historyQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {historyQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your sadhana history. Please try
          again.
        </p>
      ) : null}

      {historyQuery.isSuccess && reports.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
          <p className="text-sm text-muted-foreground">
            No Sadhana reports found for this range.
          </p>
          <Button asChild>
            <Link to="/sadhana">Fill Sadhana</Link>
          </Button>
        </div>
      ) : null}

      {reports.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border rounded-lg border px-4">
          {reports.map((report) => (
            <li key={report.id}>
              <SadhanaReportSummaryRow report={report} variant="detailed" />
            </li>
          ))}
        </ul>
      ) : null}

      {historyQuery.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => historyQuery.fetchNextPage()}
          disabled={historyQuery.isFetchingNextPage}
          className="self-center"
        >
          {historyQuery.isFetchingNextPage ? 'Loading more…' : 'Load more'}
        </Button>
      ) : null}
    </div>
  )
}
