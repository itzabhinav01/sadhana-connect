import { FileSpreadsheet, Printer, Table2 } from 'lucide-react'
import type { SadhanaReport } from '@sadhana-connect/domain'
import { formatIsoDateAsDdMmYyyy } from '@sadhana-connect/shared'
import { Button } from '@/presentation/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import {
  ReportSections,
  SadhanaSummarySheetTable,
} from '@/presentation/pages/sadhana/SadhanaExportPrintView'

interface SadhanaReportPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devoteeName?: string
  fromDate: string
  toDate: string
  reports: SadhanaReport[]
  isPending?: boolean
  onPrintPdf: () => void
  onDownloadCsv: () => void
  onDownloadColoredSheet?: () => void
}

export function SadhanaReportPreviewModal({
  open,
  onOpenChange,
  devoteeName,
  fromDate,
  toDate,
  reports,
  isPending = false,
  onPrintPdf,
  onDownloadCsv,
  onDownloadColoredSheet,
}: SadhanaReportPreviewModalProps) {
  const sortedReports = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))

  const totalRounds = sortedReports.reduce((acc, r) => acc + r.totalRounds, 0)
  const totalReading = sortedReports.reduce((acc, r) => acc + r.readingMinutes, 0)
  const totalHearing = sortedReports.reduce((acc, r) => acc + r.hearingMinutes, 0)
  const avgRounds = sortedReports.length > 0 ? (totalRounds / sortedReports.length).toFixed(1) : '0'
  const below16Days = sortedReports.filter((r) => r.totalRounds < 16).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0 sm:max-w-4xl">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="border-b p-4 sm:p-6 pb-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pr-8">
              <div>
                <DialogTitle className="text-xl font-bold">
                  Sadhana Report Preview
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  {devoteeName ? <span className="font-semibold text-foreground">{devoteeName} · </span> : null}
                  {formatIsoDateAsDdMmYyyy(fromDate)} to {formatIsoDateAsDdMmYyyy(toDate)}
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                {onDownloadColoredSheet ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onDownloadColoredSheet}
                    disabled={isPending || reports.length === 0}
                  >
                    <Table2 className="size-4 mr-1.5" aria-hidden="true" />
                    Colored Sheet (.xls)
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onDownloadCsv}
                  disabled={isPending || reports.length === 0}
                >
                  <FileSpreadsheet className="size-4 mr-1.5" aria-hidden="true" />
                  Export CSV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onPrintPdf}
                  disabled={isPending || reports.length === 0}
                >
                  <Printer className="size-4 mr-1.5" aria-hidden="true" />
                  Print / Save PDF
                </Button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            {!isPending && reports.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 rounded-lg bg-muted/60 p-3 text-center">
                <div>
                  <span className="text-xs text-muted-foreground">Reports</span>
                  <p className="text-sm font-semibold text-foreground">{reports.length} days</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total Rounds</span>
                  <p className="text-sm font-semibold text-foreground">{totalRounds} ({avgRounds}/day)</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Below 16 (&lt;16)</span>
                  <p
                    className={`text-sm font-bold ${
                      below16Days > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {below16Days} {below16Days === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Reading</span>
                  <p className="text-sm font-semibold text-foreground">{totalReading} min</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Hearing</span>
                  <p className="text-sm font-semibold text-foreground">{totalHearing} min</p>
                </div>
              </div>
            ) : null}
          </DialogHeader>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isPending ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Loading Sadhana reports…</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No Sadhana reports found in this date range.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-6 shadow-xs text-card-foreground">
                <div className="border-b-2 border-amber-600 pb-4 mb-4">
                  <h2 className="text-lg font-bold">
                    {devoteeName ? `${devoteeName} — ` : ''}Sadhana Report
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Date Range: {formatIsoDateAsDdMmYyyy(fromDate)} to {formatIsoDateAsDdMmYyyy(toDate)}
                  </p>
                </div>

                <SadhanaSummarySheetTable reports={sortedReports} />

                <div className="mt-6 flex flex-col divide-y divide-border">
                  {sortedReports.map((report) => (
                    <div key={report.id} className="py-6 first:pt-0 last:pb-0">
                      <ReportSections report={report} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

