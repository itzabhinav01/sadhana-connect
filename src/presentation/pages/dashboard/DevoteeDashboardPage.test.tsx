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

vi.mock('@sadhana-connect/sadhana', () => ({
  useSadhanaReport: useSadhanaReportMock,
  useSadhanaStreak: useSadhanaStreakMock,
  useWeeklySadhanaSummary: useWeeklySadhanaSummaryMock,
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

  // A direct "Suspense fallback is showing before the lazy import
  // resolves" assertion is not reliably observable in this Vitest/Vite
  // SSR-transform test environment: unlike a real browser fetching a
  // network chunk, Vite's test-mode module loader can resolve a dynamic
  // import() within the same synchronous render pass regardless of
  // module-cache freshness (confirmed: neither reordering this test to
  // run first, nor vi.resetModules() + a fresh dynamic re-import,
  // produced an observable pending state). The Suspense wiring itself is
  // covered by (a) ChartSkeleton.test.tsx, which verifies the fallback
  // component renders correctly in isolation, (b) 'renders every card'
  // below, which proves the lazy-loaded chart correctly appears through
  // the Suspense boundary, and (c) live browser E2E (Phase 20 report),
  // which does observe the real fallback during genuine network latency.

  it('renders every card', async () => {
    renderDashboard()

    expect(
      screen.getByRole('heading', { name: /today's sadhana/i }),
    ).toBeInTheDocument()
    // Weekly Rounds is code-split (Phase 20, React.lazy + Suspense) — its
    // heading only appears once the lazy import resolves.
    expect(
      await screen.findByRole('heading', { name: /weekly rounds/i }),
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
