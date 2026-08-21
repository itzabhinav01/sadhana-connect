import type { SadhanaReportRangeSummary } from '@/domain/entities/sadhana-report'
import { buildDateRangeList } from '@/shared/utils/date'

export interface WeeklyChartPoint {
  date: string
  totalRounds: number
  hasReport: boolean
}

export interface WeeklySadhanaSummary {
  startDate: string
  endDate: string
  totalReports: number
  // Average of total_rounds across submitted days only — missing days
  // are never treated as 0 for this average (approved product decision,
  // Phase 7). Consistency is separately reflected in completionRate.
  averageTotalRounds: number
  totalReadingMinutes: number
  totalHearingMinutes: number
  // submitted reports / days in range, as a 0..1 fraction.
  completionRate: number
  chartData: WeeklyChartPoint[]
}

// `reports` need not cover every day in [startDate, endDate] — gap days
// are filled in here as zero-value, hasReport:false chart points, never
// fabricated with a guessed non-zero value.
export function calculateWeeklySummary(
  reports: SadhanaReportRangeSummary[],
  startDate: string,
  endDate: string,
): WeeklySadhanaSummary {
  const reportsByDate = new Map(reports.map((report) => [report.reportDate, report]))

  const days = buildDateRangeList(startDate, endDate)

  const chartData: WeeklyChartPoint[] = days.map((date) => {
    const report = reportsByDate.get(date)
    return {
      date,
      totalRounds: report?.totalRounds ?? 0,
      hasReport: Boolean(report),
    }
  })

  const totalReports = reports.length
  const averageTotalRounds =
    totalReports === 0
      ? 0
      : reports.reduce((sum, report) => sum + report.totalRounds, 0) /
        totalReports
  const totalReadingMinutes = reports.reduce(
    (sum, report) => sum + report.readingMinutes,
    0,
  )
  const totalHearingMinutes = reports.reduce(
    (sum, report) => sum + report.hearingMinutes,
    0,
  )
  const completionRate = days.length === 0 ? 0 : totalReports / days.length

  return {
    startDate,
    endDate,
    totalReports,
    averageTotalRounds,
    totalReadingMinutes,
    totalHearingMinutes,
    completionRate,
    chartData,
  }
}
