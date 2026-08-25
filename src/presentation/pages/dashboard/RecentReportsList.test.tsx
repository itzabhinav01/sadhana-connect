import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecentReportsList } from '@/presentation/pages/dashboard/RecentReportsList'

const { useRecentSadhanaReportsMock } = vi.hoisted(() => ({
  useRecentSadhanaReportsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/sadhana', () => ({
  useRecentSadhanaReports: useRecentSadhanaReportsMock,
}))

function renderList() {
  return render(
    <MemoryRouter>
      <RecentReportsList />
    </MemoryRouter>,
  )
}

describe('RecentReportsList', () => {
  beforeEach(() => {
    useRecentSadhanaReportsMock.mockReset()
  })

  it('shows a loading state', () => {
    useRecentSadhanaReportsMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })

    renderList()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useRecentSadhanaReportsMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    })

    renderList()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows an empty state for a new devotee with no reports', () => {
    useRecentSadhanaReportsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    })

    renderList()

    expect(screen.getByText(/no reports yet/i)).toBeInTheDocument()
  })

  it('shows at most 5 reports, each linking to the dated Sadhana page', () => {
    const reports = Array.from({ length: 8 }, (_, index) => ({
      id: `report-${index}`,
      reportDate: `2026-01-${String(15 - index).padStart(2, '0')}`,
      totalRounds: 16,
    }))
    useRecentSadhanaReportsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: reports,
    })

    renderList()

    // 5 displayed reports x 2 links each (date + Share to WhatsApp, Phase 15).
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(10)
    expect(links[0]).toHaveAttribute('href', '/sadhana?date=2026-01-15')
  })

  it('never shows Export PDF or Export Text — export actions are History-only (Phase 16)', () => {
    useRecentSadhanaReportsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: [{ id: 'report-1', reportDate: '2026-01-15', totalRounds: 16 }],
    })

    renderList()

    expect(screen.queryByRole('button', { name: 'Export PDF' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Export Text' })).not.toBeInTheDocument()
  })
})
