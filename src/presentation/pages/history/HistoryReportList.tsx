import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'

import { formatSadhanaReportForText } from '@/application/sadhana/format-sadhana-report-for-text'
import { buildSadhanaSingleExportFilename } from '@/application/sadhana/sadhana-export-filename'
import { useSadhanaHistory } from '@/application/sadhana/use-sadhana-history'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { downloadTextFile } from '@/shared/utils/download-text-file'
import { Button } from '@/presentation/components/ui/button'
import { SadhanaExportPrintView } from '@/presentation/pages/sadhana/SadhanaExportPrintView'
import { SadhanaReportSummaryRow } from '@/presentation/pages/sadhana/SadhanaReportSummaryRow'

interface HistoryReportListProps {
  fromDate?: string
  toDate?: string
}

export function HistoryReportList({ fromDate, toDate }: HistoryReportListProps) {
  const historyQuery = useSadhanaHistory({ fromDate, toDate })

  // Each row's report is already fully loaded (it's what's on screen) —
  // exporting it needs no additional query.
  const [printTarget, setPrintTarget] = useState<{ report: SadhanaReport } | null>(null)

  // flushSync forces the print view to actually be in the DOM before
  // window.print() runs (a plain setState here wouldn't commit until
  // after this handler returns). Cleared again immediately afterward —
  // window.print() blocks in real browsers until the dialog is dismissed
  // — so this print view is never left mounted for a later export
  // (row-level or page-level range) to collide with; without clearing it,
  // two simultaneously non-null print targets would both be
  // visibility:visible at once under the global print CSS.
  function handleExportPdf(report: SadhanaReport) {
    flushSync(() => setPrintTarget({ report }))
    window.print()
    flushSync(() => setPrintTarget(null))
  }

  function handleExportText(report: SadhanaReport) {
    downloadTextFile(
      buildSadhanaSingleExportFilename(report.reportDate, 'txt'),
      formatSadhanaReportForText(report),
    )
  }

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
              <SadhanaReportSummaryRow
                report={report}
                variant="detailed"
                onExportPdf={handleExportPdf}
                onExportText={handleExportText}
              />
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

      {printTarget ? (
        <SadhanaExportPrintView mode="single" report={printTarget.report} />
      ) : null}
    </div>
  )
}
