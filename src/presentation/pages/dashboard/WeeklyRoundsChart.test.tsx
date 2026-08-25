import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WeeklyRoundsChart } from '@/presentation/pages/dashboard/WeeklyRoundsChart'

const { useWeeklySadhanaSummaryMock } = vi.hoisted(() => ({
  useWeeklySadhanaSummaryMock: vi.fn(),
}))

vi.mock('@sadhana-connect/sadhana', () => ({
  useWeeklySadhanaSummary: useWeeklySadhanaSummaryMock,
}))

const sevenDayChartData = [
  { date: '2026-01-09', totalRounds: 0, hasReport: false },
  { date: '2026-01-10', totalRounds: 0, hasReport: false },
  { date: '2026-01-11', totalRounds: 0, hasReport: false },
  { date: '2026-01-12', totalRounds: 0, hasReport: false },
  { date: '2026-01-13', totalRounds: 0, hasReport: false },
  { date: '2026-01-14', totalRounds: 0, hasReport: false },
  { date: '2026-01-15', totalRounds: 16, hasReport: true },
]

describe('WeeklyRoundsChart', () => {
  beforeEach(() => {
    useWeeklySadhanaSummaryMock.mockReset()
  })

  it('shows a loading state', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })

    render(<WeeklyRoundsChart />)

    expect(screen.getByText(/loading chart/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    })

    render(<WeeklyRoundsChart />)

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows a caption and a fixed 7-day domain when there is no data at all', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        startDate: '2026-01-09',
        endDate: '2026-01-15',
        totalReports: 0,
        averageTotalRounds: 0,
        totalReadingMinutes: 0,
        totalHearingMinutes: 0,
        completionRate: 0,
        chartData: sevenDayChartData.map((point) => ({
          ...point,
          totalRounds: 0,
          hasReport: false,
        })),
      },
    })

    render(<WeeklyRoundsChart />)

    expect(
      screen.getByText(/no sadhana logged this week yet/i),
    ).toBeInTheDocument()
  })

  it('renders a text-equivalent summary for one day of data within a partial week', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        startDate: '2026-01-09',
        endDate: '2026-01-15',
        totalReports: 1,
        averageTotalRounds: 16,
        totalReadingMinutes: 15,
        totalHearingMinutes: 30,
        completionRate: 1 / 7,
        chartData: sevenDayChartData,
      },
    })

    render(<WeeklyRoundsChart />)

    expect(
      screen.queryByText(/no sadhana logged this week yet/i),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/1 of 7 days logged this week, totaling 16 rounds/i),
    ).toBeInTheDocument()
  })
})
