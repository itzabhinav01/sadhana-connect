import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoryReportList } from '@/presentation/pages/history/HistoryReportList'

const { useSadhanaHistoryMock, downloadTextFileMock } = vi.hoisted(() => ({
  useSadhanaHistoryMock: vi.fn(),
  downloadTextFileMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-history', () => ({
  useSadhanaHistory: useSadhanaHistoryMock,
}))

vi.mock('@/shared/utils/download-text-file', () => ({
  downloadTextFile: downloadTextFileMock,
}))

function makeReport(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'report-1',
    profileId: 'user-1',
    reportDate: '2026-01-15',
    roundsBefore430: 4,
    roundsTill7am: 8,
    lastRoundTime: '06:45',
    totalRounds: 16,
    readingMinutes: 15,
    bookName: null,
    hearingMinutes: 30,
    speakerName: null,
    sleepTime: null,
    wakeTime: null,
    dayRestMinutes: 0,
    totalRestMinutes: 0,
    officeGoingTime: null,
    officeReturnTime: null,
    notes: null,
    signatureText: 'Test Devotee',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
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

  it('renders Export PDF and Export Text actions on every row', () => {
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

    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export Text' })).toBeInTheDocument()
  })

  it('clicking Export Text downloads the exact formatted report with the correct filename', async () => {
    const report = makeReport()
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ reports: [report] }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })
    downloadTextFileMock.mockReset()
    const user = userEvent.setup()

    renderList()
    await user.click(screen.getByRole('button', { name: 'Export Text' }))

    expect(downloadTextFileMock).toHaveBeenCalledTimes(1)
    const [filename, content] = downloadTextFileMock.mock.calls[0]
    expect(filename).toBe('Sadhana-2026-01-15.txt')
    expect(content).toContain('SADHANA REPORT')
    expect(content).toContain('Date: 15-01-2026')
  })

  it('clicking Export PDF populates the single-report print view before printing, then clears it', async () => {
    const report = makeReport({ signatureText: 'Print Test Devotee' })
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ reports: [report] }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })
    // The print view is populated, then window.print() is called, then the
    // print target is cleared — all within the same effect (see
    // HistoryReportList.tsx). Capturing the DOM from inside the print()
    // mock itself is the only way to observe the populated state, since by
    // the time the click handler's promise resolves it has already been
    // cleared again.
    let printViewTextAtPrintTime: string | null = null
    const printSpy = vi.fn(() => {
      printViewTextAtPrintTime = screen.queryByText('Print Test Devotee')?.textContent ?? null
    })
    window.print = printSpy
    const user = userEvent.setup()

    renderList()
    expect(screen.queryByText('Print Test Devotee')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Export PDF' }))

    expect(printSpy).toHaveBeenCalledTimes(1)
    expect(printViewTextAtPrintTime).toBe('Print Test Devotee')
    // Cleared again afterward — never left mounted for a later export
    // (row-level or range-level) to collide with.
    expect(screen.queryByText('Print Test Devotee')).not.toBeInTheDocument()
  })
})
