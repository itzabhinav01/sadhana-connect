import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getLastNDaysRange,
  validateDateRange,
  type SadhanaDateRange,
} from '@/application/sadhana/sadhana-date-range'
import { useSadhanaAnalytics } from '@/application/sadhana/use-sadhana-analytics'
import { ChartSkeleton } from '@/presentation/components/ChartSkeleton'
import { Button } from '@/presentation/components/ui/button'
import {
  AnalyticsRangeSelector,
  type AnalyticsRangeOption,
} from '@/presentation/pages/analytics/AnalyticsRangeSelector'
import { AnalyticsSummaryCards } from '@/presentation/pages/analytics/AnalyticsSummaryCards'

// Code-split (Phase 20) — see the matching note in DevoteeDashboardPage.tsx.
// This whole page is chart-centric, so both charts defer together, but
// each keeps its own Suspense boundary rather than sharing one, so a
// slow fetch of one chart's chunk never blocks the other from appearing.
const AnalyticsRoundsChart = lazy(() =>
  import('@/presentation/pages/analytics/AnalyticsRoundsChart').then((m) => ({
    default: m.AnalyticsRoundsChart,
  })),
)
const AnalyticsStudyChart = lazy(() =>
  import('@/presentation/pages/analytics/AnalyticsStudyChart').then((m) => ({
    default: m.AnalyticsStudyChart,
  })),
)

// One page-level query (not per-card/per-chart, unlike the dashboard) —
// every section here is a facet of the exact same range query, so there
// is no independent-loading benefit to re-fetching per section.
export function AnalyticsPage() {
  const [option, setOption] = useState<AnalyticsRangeOption>('7')
  const [customRange, setCustomRange] = useState<SadhanaDateRange>(() =>
    getLastNDaysRange(7),
  )

  // Quick options are always computed fresh from "today" on every render
  // rather than stored as fixed dates, so the range never goes stale
  // across a day boundary while the page is open.
  const range = option === 'custom' ? customRange : getLastNDaysRange(Number(option))
  const validation = validateDateRange(range.fromDate, range.toDate)

  const analyticsQuery = useSadhanaAnalytics(range.fromDate, range.toDate, {
    enabled: validation.valid,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Trends and totals from your sadhana reports.
        </p>
      </div>

      <AnalyticsRangeSelector
        option={option}
        customRange={customRange}
        error={validation.valid ? null : validation.error}
        onOptionChange={setOption}
        onCustomRangeChange={setCustomRange}
      />

      {validation.valid && analyticsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {validation.valid && analyticsQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your analytics. Please try again.
        </p>
      ) : null}

      {validation.valid && analyticsQuery.data ? (
        analyticsQuery.data.totalReports === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              No Sadhana reports found for this range.
            </p>
            <Button asChild>
              <Link to="/sadhana">Fill Sadhana</Link>
            </Button>
          </div>
        ) : (
          <>
            <AnalyticsSummaryCards summary={analyticsQuery.data} />
            <Suspense fallback={<ChartSkeleton title="Daily Total Rounds" />}>
              <AnalyticsRoundsChart chartData={analyticsQuery.data.roundsChartData} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton title="Reading & Hearing" />}>
              <AnalyticsStudyChart chartData={analyticsQuery.data.studyChartData} />
            </Suspense>
          </>
        )
      ) : null}
    </div>
  )
}
