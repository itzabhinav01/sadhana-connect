import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoryPage } from '@/presentation/pages/history/HistoryPage'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'

const {
  useSadhanaHistoryMock,
  useAuthMock,
  listReportsInRangeMock,
  downloadTextFileMock,
} = vi.hoisted(() => ({
  useSadhanaHistoryMock: vi.fn(),
  useAuthMock: vi.fn(),
  listReportsInRangeMock: vi.fn(),
  downloadTextFileMock: vi.fn(),
}))

vi.mock('@sadhana-connect/sadhana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/sadhana')>()
  return {
    ...actual,
    useSadhanaHistory: useSadhanaHistoryMock,
  }
})

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseSadhanaReportRepository: {
    listReportsInRange: listReportsInRangeMock,
    listFullReportsInRange: listReportsInRangeMock,
  },
}))

vi.mock('@/shared/utils/download-text-file', () => ({
  downloadTextFile: downloadTextFileMock,
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

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

describe('HistoryPage', () => {
  beforeEach(() => {
    useSadhanaHistoryMock.mockReset()
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ reports: [] }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })
    useAuthMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'devotee@example.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listReportsInRangeMock.mockReset()
    downloadTextFileMock.mockReset()
  })

  it('starts with no filters applied', () => {
    renderPage()

    expect(useSadhanaHistoryMock).toHaveBeenCalledWith({
      fromDate: undefined,
      toDate: undefined,
    })
  })

  it('applying a quick filter re-queries history with the computed range', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /last 30 days/i }))

    const today = getLocalDateIso()
    expect(useSadhanaHistoryMock).toHaveBeenLastCalledWith({
      fromDate: addDaysIso(today, -29),
      toDate: undefined,
    })
  })

  it('does not display results from the previous filter while the new query loads', async () => {
    // First render: some reports for the default (no filter) view.
    useSadhanaHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        pages: [{ reports: [{ id: 'r1', reportDate: '2026-01-15', totalRounds: 16 }] }],
      },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    const user = userEvent.setup()
    renderPage()
    // One report row renders two links: the date link and the Share to
    // WhatsApp link (Phase 15).
    expect(screen.getAllByRole('link')).toHaveLength(2)

    // Simulate the hook's real "no placeholderData" behavior on a filter
    // change: it returns pending/no-data immediately, not stale results.
    useSadhanaHistoryMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    await user.click(screen.getByRole('button', { name: /last 30 days/i }))

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  describe('range export', () => {
    it('disables Export PDF and Export Text when no concrete range is selected (All time)', () => {
      renderPage()

      expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Export Text' })).toBeDisabled()
      expect(
        screen.getByText('Choose a specific date range (not All time) to export.'),
      ).toBeInTheDocument()
    })

    it('enables export once a concrete range is selected via a quick filter', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: /last 30 days/i }))

      expect(screen.getByRole('button', { name: 'Export PDF' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Export Text' })).toBeEnabled()
    })

    it('shows the validation error and keeps export disabled for an inverted range', () => {
      renderPage()

      fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-20' } })
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-10' } })

      expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled()
      expect(screen.getByText('From date must be before To date.')).toBeInTheDocument()
    })

    it('Export Text fetches the range via listFullReportsInRange and downloads the exact formatted text', async () => {
      const report = makeReport()
      listReportsInRangeMock.mockResolvedValue([report])
      const user = userEvent.setup()
      renderPage()

      fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })
      await user.click(screen.getByRole('button', { name: 'Export Text' }))

      expect(listReportsInRangeMock).toHaveBeenCalledWith(
        'user-1',
        '2026-01-01',
        getLocalDateIso(),
      )
      expect(downloadTextFileMock).toHaveBeenCalledTimes(1)
      const [filename, content] = downloadTextFileMock.mock.calls[0]
      expect(filename).toBe(`Sadhana-2026-01-01-to-${getLocalDateIso()}.txt`)
      expect(content).toContain('SADHANA REPORTS')
    })

    it('Export PDF fetches the range, populates the range print view before printing, then clears it', async () => {
      const report = makeReport({ signatureText: 'Range Print Devotee' })
      listReportsInRangeMock.mockResolvedValue([report])
      // See the matching test in HistoryReportList.test.tsx: the print
      // target is cleared immediately after window.print() is called (so a
      // later export never collides with a stale print view), so the only
      // way to observe the populated content is from inside the print()
      // mock itself.
      let printViewTextAtPrintTime: string | null = null
      const printSpy = vi.fn(() => {
        printViewTextAtPrintTime =
          screen.queryByText('Range Print Devotee')?.textContent ?? null
      })
      window.print = printSpy
      const user = userEvent.setup()
      renderPage()

      fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })
      await user.click(screen.getByRole('button', { name: 'Export PDF' }))

      expect(printSpy).toHaveBeenCalledTimes(1)
      expect(printViewTextAtPrintTime).toBe('Range Print Devotee')
      // The clearing setState happens in the same effect as window.print(),
      // one render cycle after the async fetch resolves — wait for it
      // rather than asserting synchronously.
      await waitFor(() =>
        expect(screen.queryByText('Range Print Devotee')).not.toBeInTheDocument(),
      )
    })

    it('shows an error message when the range export fetch fails', async () => {
      listReportsInRangeMock.mockRejectedValue(new Error('network error'))
      const user = userEvent.setup()
      renderPage()

      fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } })
      await user.click(screen.getByRole('button', { name: 'Export Text' }))

      expect(
        await screen.findByText(/something went wrong exporting your reports/i),
      ).toBeInTheDocument()
      expect(screen.queryByText(/postgres|supabase|rls/i)).toBeNull()
    })
  })
})
