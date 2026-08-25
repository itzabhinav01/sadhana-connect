import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MentorDashboardPage } from '@/presentation/pages/mentor/MentorDashboardPage'

const { useMentorDevoteesMock } = vi.hoisted(() => ({
  useMentorDevoteesMock: vi.fn(),
}))

vi.mock('@sadhana-connect/mentor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/mentor')>()
  return {
    ...actual,
    useMentorDevotees: useMentorDevoteesMock,
  }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <MentorDashboardPage />
    </MemoryRouter>,
  )
}

describe('MentorDashboardPage', () => {
  beforeEach(() => {
    useMentorDevoteesMock.mockReset()
  })

  it('shows a loading state while pending', () => {
    useMentorDevoteesMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state on failure', () => {
    useMentorDevoteesMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows an empty state (not an error) when there are zero assigned devotees', () => {
    useMentorDevoteesMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    renderPage()

    expect(
      screen.getByText('No devotees are currently assigned to you.'),
    ).toBeInTheDocument()
  })

  it('renders summary cards and the devotee list when devotees are assigned', () => {
    useMentorDevoteesMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          devoteeId: 'd1',
          fullName: 'Devotee One',
          assignedAt: '2025-01-01T00:00:00.000Z',
          hasSubmittedToday: true,
          todayTotalRounds: 16,
          lastReportDate: '2026-01-15',
        },
      ],
    })

    renderPage()

    expect(screen.getByText('Total Assigned')).toBeInTheDocument()
    expect(screen.getAllByText('Devotee One').length).toBeGreaterThan(0)
  })

  it('filters the list to only pending devotees when "Pending Today" is selected', async () => {
    useMentorDevoteesMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          devoteeId: 'd1',
          fullName: 'Submitted Devotee',
          assignedAt: '2025-01-01T00:00:00.000Z',
          hasSubmittedToday: true,
          todayTotalRounds: 16,
          lastReportDate: '2026-01-15',
        },
        {
          devoteeId: 'd2',
          fullName: 'Pending Devotee',
          assignedAt: '2025-01-01T00:00:00.000Z',
          hasSubmittedToday: false,
          todayTotalRounds: null,
          lastReportDate: null,
        },
      ],
    })
    const user = userEvent.setup()

    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Pending Today' }))

    expect(screen.getAllByText('Pending Devotee').length).toBeGreaterThan(0)
    expect(screen.queryByText('Submitted Devotee')).not.toBeInTheDocument()
  })
})
