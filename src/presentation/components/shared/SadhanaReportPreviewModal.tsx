import { FileSpreadsheet, Printer } from 'lucide-react'
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
import { ReportSections } from '@/presentation/pages/sadhana/SadhanaExportPrintView'

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
}: SadhanaReportPreviewModalProps) {
  const sortedReports = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))

  const totalRounds = sortedReports.reduce((acc, r) => acc + r.totalRounds, 0)
  const totalReading = sortedReports.reduce((acc, r) => acc + r.readingMinutes, 0)
  const totalHearing = sortedReports.reduce((acc, r) => acc + r.hearingMinutes, 0)
  const avgRounds = sortedReports.length > 0 ? (totalRounds / sortedReports.length).toFixed(1) : '0'

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
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-lg bg-muted/60 p-3 text-center">
                <div>
                  <span className="text-xs text-muted-foreground">Reports</span>
                  <p className="text-sm font-semibold text-foreground">{reports.length} days</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total Rounds</span>
                  <p className="text-sm font-semibold text-foreground">{totalRounds} ({avgRounds}/day)</p>
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
                <div className="border-b pb-4 mb-6">
                  <h2 className="text-lg font-bold">
                    {devoteeName ? `${devoteeName} — ` : ''}Sadhana Report
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Date Range: {formatIsoDateAsDdMmYyyy(fromDate)} to {formatIsoDateAsDdMmYyyy(toDate)}
                  </p>
                </div>

                <div className="flex flex-col divide-y divide-border">
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
