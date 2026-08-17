import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DevoteeDashboardPage } from '@/presentation/pages/dashboard/DevoteeDashboardPage'

const {
  useSadhanaReportMock,
  useSadhanaStreakMock,
  useWeeklySadhanaSummaryMock,
  useRecentSadhanaReportsMock,
} = vi.hoisted(() => ({
  useSadhanaReportMock: vi.fn(),
  useSadhanaStreakMock: vi.fn(),
  useWeeklySadhanaSummaryMock: vi.fn(),
  useRecentSadhanaReportsMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-report', () => ({
  useSadhanaReport: useSadhanaReportMock,
}))
vi.mock('@/application/sadhana/use-sadhana-streak', () => ({
  useSadhanaStreak: useSadhanaStreakMock,
}))
vi.mock('@/application/sadhana/use-weekly-sadhana-summary', () => ({
  useWeeklySadhanaSummary: useWeeklySadhanaSummaryMock,
}))
vi.mock('@/application/sadhana/use-recent-sadhana-reports', () => ({
  useRecentSadhanaReports: useRecentSadhanaReportsMock,
}))

const weeklyData = {
  startDate: '2026-01-09',
  endDate: '2026-01-15',
  totalReports: 1,
  averageTotalRounds: 16,
  totalReadingMinutes: 15,
  totalHearingMinutes: 30,
  completionRate: 1 / 7,
  chartData: [
    { date: '2026-01-15', totalRounds: 16, hasReport: true },
  ],
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DevoteeDashboardPage />
    </MemoryRouter>,
  )
}

describe('DevoteeDashboardPage', () => {
  beforeEach(() => {
    useSadhanaReportMock.mockReset()
    useSadhanaStreakMock.mockReset()
    useWeeklySadhanaSummaryMock.mockReset()
    useRecentSadhanaReportsMock.mockReset()

    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })
    useSadhanaStreakMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: 0,
    })
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: weeklyData,
    })
    useRecentSadhanaReportsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    })
  })

  it('renders every card', () => {
    renderDashboard()

    expect(
      screen.getByRole('heading', { name: /today's sadhana/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /weekly rounds/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /this week/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /recent reports/i }),
    ).toBeInTheDocument()
  })

  it('keeps other cards working when one card errors', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    })

    renderDashboard()

    // Today card (independent hook) still renders its Fill CTA even
    // though the weekly-summary-backed cards are erroring.
    expect(
      screen.getByRole('link', { name: /fill sadhana/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/no reports yet/i),
    ).toBeInTheDocument()
  })
})
