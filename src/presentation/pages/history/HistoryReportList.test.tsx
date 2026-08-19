import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoryReportList } from '@/presentation/pages/history/HistoryReportList'

const { useSadhanaHistoryMock } = vi.hoisted(() => ({
  useSadhanaHistoryMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-history', () => ({
  useSadhanaHistory: useSadhanaHistoryMock,
}))

function makeReport(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'report-1',
    reportDate: '2026-01-15',
    totalRounds: 16,
    readingMinutes: 15,
    hearingMinutes: 30,
    sleepTime: null,
    wakeTime: null,
    ...overrides,
  }
}

function renderList(props: { fromDate?: string; toDate?: string } = {}) {
  return render(
    <MemoryRouter>
      <HistoryReportList {...props} />
    </MemoryRouter>,
  )
}

describe('HistoryReportList', () => {
  beforeEach(() => {
    useSadhanaHistoryMock.mockReset()
  })

  it('shows a loading state', () => {
    useSadhanaHistoryMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    renderList()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state without leaking backend details', () => {
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    renderList()

    expect(
      screen.getByText(/something went wrong loading your sadhana history/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/postgres|supabase|rls/i)).toBeNull()
  })

  it('shows the empty state with a CTA to /sadhana when there are no reports', () => {
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ reports: [], nextCursor: null }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    renderList()

    expect(
      screen.getByText(/no sadhana reports found/i),
    ).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /fill sadhana/i })
    expect(cta).toHaveAttribute('href', '/sadhana')
  })

  it('renders reports newest-first as returned by the query, each linking to its date', () => {
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        pages: [
          {
            reports: [
              makeReport({ id: 'r1', reportDate: '2026-01-15' }),
              makeReport({ id: 'r2', reportDate: '2026-01-14' }),
            ],
            nextCursor: null,
          },
        ],
      },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    renderList()

    // Each row now renders two links: the date link and the Share to
    // WhatsApp link (Phase 15) — 2 reports x 2 links each.
    const dateLinks = screen.getAllByRole('link', { name: /01\/1[45]\/2026/ })
    expect(dateLinks).toHaveLength(2)
    expect(dateLinks[0]).toHaveAttribute('href', '/sadhana?date=2026-01-15')
    expect(dateLinks[1]).toHaveAttribute('href', '/sadhana?date=2026-01-14')
    expect(screen.getAllByRole('link', { name: 'Share to WhatsApp' })).toHaveLength(2)
  })

  it('flattens multiple fetched pages into one list', () => {
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        pages: [
          { reports: [makeReport({ id: 'r1', reportDate: '2026-01-15' })] },
          { reports: [makeReport({ id: 'r2', reportDate: '2025-12-20' })] },
        ],
      },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    renderList()

    // 2 reports across 2 pages x 2 links each (date + Share to WhatsApp).
    expect(screen.getAllByRole('link')).toHaveLength(4)
  })

  it('shows a Load More button when there is a next page, and calls fetchNextPage', async () => {
    const fetchNextPage = vi.fn()
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ reports: [makeReport()] }] },
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    })

    const user = userEvent.setup()
    renderList()

    const button = screen.getByRole('button', { name: /load more/i })
    await user.click(button)

    expect(fetchNextPage).toHaveBeenCalled()
  })

  it('hides the Load More button when there is no next page', () => {
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ reports: [makeReport()] }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    renderList()

    expect(
      screen.queryByRole('button', { name: /load more/i }),
    ).not.toBeInTheDocument()
  })

  it('passes the fromDate/toDate props through to the history hook', () => {
    useSadhanaHistoryMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    renderList({ fromDate: '2026-01-01', toDate: '2026-01-15' })

    expect(useSadhanaHistoryMock).toHaveBeenCalledWith({
      fromDate: '2026-01-01',
      toDate: '2026-01-15',
    })
  })
})
