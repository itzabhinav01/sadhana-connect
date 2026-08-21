import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnalyticsPage } from '@/presentation/pages/analytics/AnalyticsPage'
import { getLastNDaysRange } from '@/application/sadhana/sadhana-date-range'

const { useSadhanaAnalyticsMock } = vi.hoisted(() => ({
  useSadhanaAnalyticsMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-analytics', () => ({
  useSadhanaAnalytics: useSadhanaAnalyticsMock,
}))

function makeSummary(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    fromDate: '2026-01-09',
    toDate: '2026-01-15',
    totalDays: 7,
    totalReports: 1,
    totalRounds: 16,
    averageRoundsPerSubmittedDay: 16,
    completionRate: 1 / 7,
    totalReadingMinutes: 15,
    averageReadingMinutesPerSubmittedDay: 15,
    totalHearingMinutes: 30,
    averageHearingMinutesPerSubmittedDay: 30,
    totalDayRestMinutes: 0,
    averageDayRestMinutesPerSubmittedDay: 0,
    totalRestMinutes: 0,
    averageTotalRestMinutesPerSubmittedDay: 0,
    roundsChartData: [{ date: '2026-01-15', totalRounds: 16, hasReport: true }],
    studyChartData: [
      { date: '2026-01-15', readingMinutes: 15, hearingMinutes: 30, hasReport: true },
    ],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  )
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    useSadhanaAnalyticsMock.mockReset()
    useSadhanaAnalyticsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: makeSummary(),
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
  // component renders correctly in isolation, (b) 'shows summary cards
  // and both charts when there is data' below, which proves both
  // lazy-loaded charts correctly appear through their Suspense
  // boundaries, and (c) live browser E2E (Phase 20 report), which does
  // observe the real fallback during genuine network latency.

  it('defaults to the last 7 days range', () => {
    renderPage()

    const expected = getLastNDaysRange(7)
    expect(useSadhanaAnalyticsMock).toHaveBeenCalledWith(
      expected.fromDate,
      expected.toDate,
      { enabled: true },
    )
  })

  it('shows a loading state', () => {
    useSadhanaAnalyticsMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useSadhanaAnalyticsMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows only the empty state (no cards/charts) when there are zero reports', () => {
    useSadhanaAnalyticsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: makeSummary({ totalReports: 0, roundsChartData: [], studyChartData: [] }),
    })

    renderPage()

    expect(
      screen.getByText(/no sadhana reports found for this range/i),
    ).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /fill sadhana/i })
    expect(cta).toHaveAttribute('href', '/sadhana')

    expect(screen.queryByText(/^rounds$/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /daily total rounds/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /reading & hearing/i }),
    ).not.toBeInTheDocument()
  })

  it('shows summary cards and both charts when there is data', async () => {
    renderPage()

    // Both charts are code-split (Phase 20, React.lazy + Suspense) — their
    // headings only appear once each lazy import resolves.
    expect(
      await screen.findByRole('heading', { name: /daily total rounds/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /reading & hearing/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/no sadhana reports found/i),
    ).not.toBeInTheDocument()
  })

  it('switching to a quick range re-queries with the computed dates', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /last 30 days/i }))

    const expected = getLastNDaysRange(30)
    expect(useSadhanaAnalyticsMock).toHaveBeenLastCalledWith(
      expected.fromDate,
      expected.toDate,
      { enabled: true },
    )
  })

  it('rejects an inverted custom range and never queries for it', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /^custom$/i }))

    // Date inputs are pre-filled by the last-7-days default and don't
    // support reliable segment-by-segment typing under jsdom — set the
    // values directly instead.
    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-01-20' },
    })
    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: '2026-01-10' },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      /from date must be before to date/i,
    )

    const lastCall = useSadhanaAnalyticsMock.mock.calls.at(-1)
    expect(lastCall?.[2]).toEqual({ enabled: false })
  })

  it('does not display results from the previous range while the new one is loading', async () => {
    // First render: data for the default range.
    useSadhanaAnalyticsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: makeSummary(),
    })
    const { rerender } = renderPage()
    expect(
      await screen.findByRole('heading', { name: /daily total rounds/i }),
    ).toBeInTheDocument()

    // Simulate the hook's real "no placeholderData" behavior once the
    // range changes: pending/no data, not stale results.
    useSadhanaAnalyticsMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })
    rerender(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('heading', { name: /daily total rounds/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
