import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SadhanaAnalyticsSummary } from '@sadhana-connect/sadhana'
import { AnalyticsSummaryCards } from '@/presentation/pages/analytics/AnalyticsSummaryCards'

function makeSummary(
  overrides: Partial<SadhanaAnalyticsSummary> = {},
): SadhanaAnalyticsSummary {
  return {
    fromDate: '2026-01-09',
    toDate: '2026-01-15',
    totalDays: 7,
    totalReports: 0,
    totalRounds: 0,
    averageRoundsPerSubmittedDay: 0,
    completionRate: 0,
    totalReadingMinutes: 0,
    averageReadingMinutesPerSubmittedDay: 0,
    totalHearingMinutes: 0,
    averageHearingMinutesPerSubmittedDay: 0,
    totalDayRestMinutes: 0,
    averageDayRestMinutesPerSubmittedDay: 0,
    totalRestMinutes: 0,
    averageTotalRestMinutesPerSubmittedDay: 0,
    roundsChartData: [],
    studyChartData: [],
    ...overrides,
  }
}

describe('AnalyticsSummaryCards', () => {
  it('shows "—" for averages when there are no submitted days', () => {
    render(<AnalyticsSummaryCards summary={makeSummary()} />)

    const dashes = screen.getAllByText('—')
    // Avg rounds, reading avg, hearing avg, day-rest avg, total-rest avg.
    expect(dashes.length).toBe(5)
  })

  it('shows computed totals and averages for a partial dataset', () => {
    render(
      <AnalyticsSummaryCards
        summary={makeSummary({
          totalReports: 2,
          totalRounds: 24,
          averageRoundsPerSubmittedDay: 12,
          completionRate: 2 / 7,
          totalReadingMinutes: 32,
          averageReadingMinutesPerSubmittedDay: 16,
          totalHearingMinutes: 60,
          averageHearingMinutesPerSubmittedDay: 30,
          totalDayRestMinutes: 40,
          averageDayRestMinutesPerSubmittedDay: 20,
          totalRestMinutes: 720,
          averageTotalRestMinutesPerSubmittedDay: 360,
        })}
      />,
    )

    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('12.0')).toBeInTheDocument()
    expect(screen.getByText('29% (2/7 days)')).toBeInTheDocument()
    expect(screen.getByText('32 min')).toBeInTheDocument()
    expect(screen.getByText('16 min')).toBeInTheDocument()
    expect(screen.getByText('60 min')).toBeInTheDocument()
    expect(screen.getByText('360 min')).toBeInTheDocument()
  })

  it('keeps day rest and total rest independent in the rendered output', () => {
    render(
      <AnalyticsSummaryCards
        summary={makeSummary({
          totalReports: 1,
          totalDayRestMinutes: 500,
          totalRestMinutes: 1,
        })}
      />,
    )

    expect(screen.getByText('500 min')).toBeInTheDocument()
    expect(screen.getByText('1 min')).toBeInTheDocument()
  })
})
