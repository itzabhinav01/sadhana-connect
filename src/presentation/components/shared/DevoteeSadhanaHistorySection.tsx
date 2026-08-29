import { Eye, FileSpreadsheet, Printer } from 'lucide-react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import type { SadhanaReport } from '@sadhana-connect/domain'
import {
  buildSadhanaHistoryCsv,
  buildSadhanaRangeExportFilename,
  getLastNDaysRange,
  sadhanaQueryKeys,
  useDevoteeReportHistory,
  validateDateRange,
  type SadhanaDateRange,
} from '@sadhana-connect/sadhana'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import { buildDateRangeList, formatIsoDateLong } from '@sadhana-connect/shared'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { DateRangeInputs } from '@/presentation/components/shared/DateRangeInputs'
import { SadhanaReportPreviewModal } from '@/presentation/components/shared/SadhanaReportPreviewModal'
import { SendReminderForm } from '@/presentation/components/shared/SendReminderForm'
import { MentorDevoteeReportRow } from '@/presentation/pages/mentor/MentorDevoteeReportRow'
import { SadhanaExportPrintView } from '@/presentation/pages/sadhana/SadhanaExportPrintView'
import { downloadTextFile } from '@/shared/utils/download-text-file'

type RangeOption = '7' | '14' | '30' | 'custom'

const QUICK_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '7', label: 'Last 1 week' },
  { value: '14', label: 'Last 2 weeks' },
  { value: '30', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
]

function formatDisplayDate(iso: string) {
  return formatIsoDateLong(iso)
}

interface DevoteeSadhanaHistorySectionProps {
  devoteeId: string
  devoteeName?: string
}

// Shared by MentorDevoteeDetailPage and AdminUserDetailPage (Phase 20B) —
// a mentor sees only their own assigned devotees here, an admin any
// devotee; both are enforced entirely by RLS
// (sadhana_reports_select/sadhana_report_comments_select), not by this
// component. Missed days are computed client-side by diffing the full
// calendar range against the report_date values actually returned — no
// new query, same technique History/Analytics already use for gap days.
export function DevoteeSadhanaHistorySection({
  devoteeId,
  devoteeName,
}: DevoteeSadhanaHistorySectionProps) {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const viewerUserId = session?.userId ?? null

  const [option, setOption] = useState<RangeOption>('7')
  const [customRange, setCustomRange] = useState<SadhanaDateRange>(() => getLastNDaysRange(7))
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [previewReports, setPreviewReports] = useState<SadhanaReport[]>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [exportError, setExportError] = useState(false)
  const [rangePrintTarget, setRangePrintTarget] = useState<{
    reports: SadhanaReport[]
    fromDate: string
    toDate: string
  } | null>(null)

  const range = option === 'custom' ? customRange : getLastNDaysRange(Number(option))
  const validation = validateDateRange(range.fromDate, range.toDate)

  const historyQuery = useDevoteeReportHistory(devoteeId, range.fromDate, range.toDate, {
    enabled: validation.valid,
  })

  const allDates = validation.valid ? buildDateRangeList(range.fromDate, range.toDate) : []
  const filledDates = new Set(historyQuery.data?.map((report) => report.reportDate) ?? [])
  const missedDates = allDates.filter((date) => !filledDates.has(date))

  async function fetchFullRangeReports(): Promise<SadhanaReport[]> {
    return queryClient.fetchQuery({
      queryKey: sadhanaQueryKeys.devoteeFullHistory(
        viewerUserId,
        devoteeId,
        range.fromDate,
        range.toDate,
      ),
      queryFn: () =>
        supabaseSadhanaReportRepository.listFullReportsInRange(
          devoteeId,
          range.fromDate,
          range.toDate,
        ),
    })
  }

  async function handleOpenPreview() {
    setExportError(false)
    setIsPreviewOpen(true)
    setIsLoadingPreview(true)
    try {
      const reports = await fetchFullRangeReports()
      setPreviewReports(reports)
    } catch {
      setExportError(true)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  async function handleExportPdf() {
    setExportError(false)
    setIsExportingPdf(true)
    try {
      const reports = await fetchFullRangeReports()
      flushSync(() =>
        setRangePrintTarget({ reports, fromDate: range.fromDate, toDate: range.toDate }),
      )
      window.print()
      flushSync(() => setRangePrintTarget(null))
    } catch {
      setExportError(true)
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleExportCsv() {
    setExportError(false)
    setIsExportingCsv(true)
    try {
      const reports = await fetchFullRangeReports()
      downloadTextFile(
        buildSadhanaRangeExportFilename(range.fromDate, range.toDate, 'csv'),
        buildSadhanaHistoryCsv(reports),
      )
    } catch {
      setExportError(true)
    } finally {
      setIsExportingCsv(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {rangePrintTarget ? (
        <SadhanaExportPrintView
          mode="range"
          reports={rangePrintTarget.reports}
          fromDate={rangePrintTarget.fromDate}
          toDate={rangePrintTarget.toDate}
          devoteeName={devoteeName}
        />
      ) : null}

      <SadhanaReportPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        devoteeName={devoteeName}
        fromDate={range.fromDate}
        toDate={range.toDate}
        reports={previewReports}
        isPending={isLoadingPreview}
        onPrintPdf={handleExportPdf}
        onDownloadCsv={handleExportCsv}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              <h2>Sadhana History</h2>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenPreview}
                disabled={!validation.valid}
              >
                <Eye className="size-4 mr-1.5" aria-hidden="true" />
                Preview PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={!validation.valid || isExportingPdf}
              >
                <Printer className="size-4 mr-1.5" aria-hidden="true" />
                {isExportingPdf ? 'Preparing…' : 'Export PDF'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={!validation.valid || isExportingCsv}
              >
                <FileSpreadsheet className="size-4 mr-1.5" aria-hidden="true" />
                {isExportingCsv ? 'Exporting…' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_OPTIONS.map((quickOption) => (
              <Button
                key={quickOption.value}
                type="button"
                variant={option === quickOption.value ? 'default' : 'outline'}
                size="sm"
                aria-pressed={option === quickOption.value}
                onClick={() => setOption(quickOption.value)}
              >
                {quickOption.label}
              </Button>
            ))}
          </div>

          {option === 'custom' ? (
            <DateRangeInputs
              idPrefix="devotee-history"
              fromDate={customRange.fromDate}
              toDate={customRange.toDate}
              onFromDateChange={(fromDate) => setCustomRange({ ...customRange, fromDate })}
              onToDateChange={(toDate) => setCustomRange({ ...customRange, toDate })}
            />
          ) : null}

          {!validation.valid ? (
            <p role="alert" className="text-sm text-destructive">
              {validation.error}
            </p>
          ) : null}

          {exportError ? (
            <p role="alert" className="text-sm text-destructive">
              Something went wrong exporting Sadhana reports. Please try again.
            </p>
          ) : null}

          {validation.valid && historyQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {validation.valid && historyQuery.isError ? (
            <p className="text-sm text-destructive">
              Something went wrong loading this devotee&apos;s history.
            </p>
          ) : null}

          {validation.valid && historyQuery.isSuccess ? (
            <p className="text-sm text-muted-foreground">
              {missedDates.length === 0
                ? `All ${allDates.length} days filled in this range.`
                : `Missed ${missedDates.length} of ${allDates.length} days: ${missedDates
                    .map(formatDisplayDate)
                    .join(', ')}`}
            </p>
          ) : null}

          {validation.valid && historyQuery.isSuccess && historyQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports in this range.</p>
          ) : null}

          {validation.valid && historyQuery.isSuccess && historyQuery.data.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {[...historyQuery.data]
                .sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1))
                .map((report) => (
                  <li key={report.id}>
                    <MentorDevoteeReportRow report={report} />
                  </li>
                ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <SendReminderForm devoteeId={devoteeId} />
    </div>
  )
}
