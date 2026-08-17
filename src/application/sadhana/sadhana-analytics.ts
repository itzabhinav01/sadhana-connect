import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { buildDateRangeList } from '@/shared/utils/date'

export interface RoundsChartPoint {
  date: string
  totalRounds: number
  hasReport: boolean
}

export interface StudyChartPoint {
  date: string
  readingMinutes: number
  hearingMinutes: number
  hasReport: boolean
}

export interface SadhanaAnalyticsSummary {
  fromDate: string
  toDate: string
  totalDays: number
  totalReports: number

  // Rounds. Missing days are excluded from totals/averages but do count
  // toward completionRate's denominator. A submitted report with
  // total_rounds = 0 is a real, counted zero — it contributes 0 to the
  // average but still counts as a completed day, unlike a missing day.
  totalRounds: number
  averageRoundsPerSubmittedDay: number
  completionRate: number // submitted reports / totalDays, 0..1

  // Reading / Hearing — same "submitted days only" averaging rule.
  totalReadingMinutes: number
  averageReadingMinutesPerSubmittedDay: number
  totalHearingMinutes: number
  averageHearingMinutesPerSubmittedDay: number

  // Rest — day_rest_minutes and total_rest_minutes stay independent
  // (Phase 6 decision); neither is derived from the other or from
  // sleep/wake here.
  totalDayRestMinutes: number
  averageDayRestMinutesPerSubmittedDay: number
  totalRestMinutes: number
  averageTotalRestMinutesPerSubmittedDay: number

  roundsChartData: RoundsChartPoint[]
  studyChartData: StudyChartPoint[]
}

function average(total: number, count: number): number {
  return count === 0 ? 0 : total / count
}

function sumBy(reports: SadhanaReport[], select: (report: SadhanaReport) => number): number {
  return reports.reduce((sum, report) => sum + select(report), 0)
}

// `reports` need not cover every day in [fromDate, toDate] — gap days
// are filled in as zero-value, hasReport:false points in both chart
// series, never fabricated with a guessed non-zero value. Sleep/wake are
// deliberately not represented anywhere here — time-only columns with no
// date can't safely produce a duration or a meaningful clock-time
// average (see Phase 9 plan).
export function calculateSadhanaAnalytics(
  reports: SadhanaReport[],
  fromDate: string,
  toDate: string,
): SadhanaAnalyticsSummary {
  const reportsByDate = new Map(reports.map((report) => [report.reportDate, report]))
  const days = buildDateRangeList(fromDate, toDate)

  const roundsChartData: RoundsChartPoint[] = days.map((date) => {
    const report = reportsByDate.get(date)
    return {
      date,
      totalRounds: report?.totalRounds ?? 0,
      hasReport: Boolean(report),
    }
  })

  const studyChartData: StudyChartPoint[] = days.map((date) => {
    const report = reportsByDate.get(date)
    return {
      date,
      readingMinutes: report?.readingMinutes ?? 0,
      hearingMinutes: report?.hearingMinutes ?? 0,
      hasReport: Boolean(report),
    }
  })

  const totalReports = reports.length
  const totalRounds = sumBy(reports, (r) => r.totalRounds)
  const totalReadingMinutes = sumBy(reports, (r) => r.readingMinutes)
  const totalHearingMinutes = sumBy(reports, (r) => r.hearingMinutes)
  const totalDayRestMinutes = sumBy(reports, (r) => r.dayRestMinutes)
  const totalRestMinutes = sumBy(reports, (r) => r.totalRestMinutes)

  return {
    fromDate,
    toDate,
    totalDays: days.length,
    totalReports,
    totalRounds,
    averageRoundsPerSubmittedDay: average(totalRounds, totalReports),
    completionRate: average(totalReports, days.length),
    totalReadingMinutes,
    averageReadingMinutesPerSubmittedDay: average(totalReadingMinutes, totalReports),
    totalHearingMinutes,
    averageHearingMinutesPerSubmittedDay: average(totalHearingMinutes, totalReports),
    totalDayRestMinutes,
    averageDayRestMinutesPerSubmittedDay: average(totalDayRestMinutes, totalReports),
    totalRestMinutes,
    averageTotalRestMinutesPerSubmittedDay: average(totalRestMinutes, totalReports),
    roundsChartData,
    studyChartData,
  }
}
