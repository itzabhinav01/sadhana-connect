import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { flushSync } from 'react-dom'

import { useAuth } from '@/application/auth/use-auth'
import { formatSadhanaReportsRangeForText } from '@/application/sadhana/format-sadhana-report-for-text'
import { buildSadhanaRangeExportFilename } from '@/application/sadhana/sadhana-export-filename'
import {
  validateDateRange,
  type DateRangeValidationResult,
} from '@/application/sadhana/sadhana-date-range'
import { sadhanaQueryKeys } from '@/application/sadhana/sadhana-query-keys'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase/sadhana-report-repository'
import { downloadTextFile } from '@/shared/utils/download-text-file'
import { getLocalDateIso } from '@/shared/utils/date'
import { Button } from '@/presentation/components/ui/button'
import {
  HistoryFilterBar,
  type HistoryDateFilters,
} from '@/presentation/pages/history/HistoryFilterBar'
import { HistoryReportList } from '@/presentation/pages/history/HistoryReportList'
import { SadhanaExportPrintView } from '@/presentation/pages/sadhana/SadhanaExportPrintView'

interface RangePrintTarget {
  reports: SadhanaReport[]
  fromDate: string
  toDate: string
}

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryDateFilters>({
    fromDate: '',
    toDate: '',
  })
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingText, setIsExportingText] = useState(false)
  const [exportError, setExportError] = useState(false)
  const [rangePrintTarget, setRangePrintTarget] = useState<RangePrintTarget | null>(null)

  const { session } = useAuth()
  const userId = session?.userId ?? null
  const queryClient = useQueryClient()

  // Page-level range export requires a concrete, bounded range — the same
  // shape listReportsInRange/validateDateRange already expect — so it is
  // deliberately unavailable for the "All time" quick filter (blank
  // fromDate), which has no lower bound to pass to either (approved
  // product decision, Phase 16).
  const today = getLocalDateIso()
  const exportFromDate = filters.fromDate
  const exportToDate = filters.toDate && filters.toDate < today ? filters.toDate : today
  const hasConcreteRange = exportFromDate !== ''
  const rangeValidation: DateRangeValidationResult = hasConcreteRange
    ? validateDateRange(exportFromDate, exportToDate)
    : { valid: false, error: 'Choose a specific date range (not All time) to export.' }
  const canExportRange = hasConcreteRange && rangeValidation.valid

  // Reuses the exact same range query key/repository call as Analytics
  // and the weekly summary (Phase 7/9) — if either is already cached for
  // this exact range, this resolves instantly with no network request.
  async function fetchRangeReports(): Promise<SadhanaReport[]> {
    if (!userId) throw new Error('HistoryPage: no authenticated user')
    return queryClient.fetchQuery({
      queryKey: sadhanaQueryKeys.range(userId, exportFromDate, exportToDate),
      queryFn: () =>
        supabaseSadhanaReportRepository.listReportsInRange(
          userId,
          exportFromDate,
          exportToDate,
        ),
    })
  }

  // flushSync forces the range print view to actually be in the DOM
  // before window.print() runs. Cleared again immediately afterward — see
  // the matching comment in HistoryReportList.tsx (row-level export) for
  // why: otherwise this range print view stays mounted, and a later
  // row-level export in the same session would print both documents
  // together, since both would be visibility:visible under the global
  // print CSS at once.
  async function handleExportRangePdf() {
    setExportError(false)
    setIsExportingPdf(true)
    try {
      const reports = await fetchRangeReports()
      flushSync(() =>
        setRangePrintTarget({ reports, fromDate: exportFromDate, toDate: exportToDate }),
      )
      window.print()
      flushSync(() => setRangePrintTarget(null))
    } catch {
      setExportError(true)
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleExportRangeText() {
    setExportError(false)
    setIsExportingText(true)
    try {
      const reports = await fetchRangeReports()
      downloadTextFile(
        buildSadhanaRangeExportFilename(exportFromDate, exportToDate, 'txt'),
        formatSadhanaReportsRangeForText(reports, exportFromDate, exportToDate),
      )
    } catch {
      setExportError(true)
    } finally {
      setIsExportingText(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Sadhana History
        </h1>
        <p className="text-muted-foreground">
          Browse your past sadhana reports.
        </p>
      </div>

      <HistoryFilterBar filters={filters} onChange={setFilters} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportRangePdf}
          disabled={!canExportRange || isExportingPdf || isExportingText}
        >
          {isExportingPdf ? 'Preparing…' : 'Export PDF'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportRangeText}
          disabled={!canExportRange || isExportingPdf || isExportingText}
        >
          {isExportingText ? 'Preparing…' : 'Export Text'}
        </Button>
        {!canExportRange ? (
          <p className="text-xs text-muted-foreground">
            {hasConcreteRange
              ? rangeValidation.valid
                ? null
                : rangeValidation.error
              : 'Choose a specific date range (not All time) to export.'}
          </p>
        ) : null}
      </div>

      {exportError ? (
        <p className="text-sm text-destructive">
          Something went wrong exporting your reports. Please try again.
        </p>
      ) : null}

      <HistoryReportList
        fromDate={filters.fromDate || undefined}
        toDate={filters.toDate || undefined}
      />

      {rangePrintTarget ? (
        <SadhanaExportPrintView
          mode="range"
          reports={rangePrintTarget.reports}
          fromDate={rangePrintTarget.fromDate}
          toDate={rangePrintTarget.toDate}
        />
      ) : null}
    </div>
  )
}
