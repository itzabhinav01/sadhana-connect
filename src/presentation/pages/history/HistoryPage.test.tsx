import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoryPage } from '@/presentation/pages/history/HistoryPage'
import { addDaysIso, getLocalDateIso } from '@/shared/utils/date'

const { useSadhanaHistoryMock } = vi.hoisted(() => ({
  useSadhanaHistoryMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-history', () => ({
  useSadhanaHistory: useSadhanaHistoryMock,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  )
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
})
