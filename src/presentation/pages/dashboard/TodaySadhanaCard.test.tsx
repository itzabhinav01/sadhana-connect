import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TodaySadhanaCard } from '@/presentation/pages/dashboard/TodaySadhanaCard'

const { useSadhanaReportMock, useSadhanaStreakMock } = vi.hoisted(() => ({
  useSadhanaReportMock: vi.fn(),
  useSadhanaStreakMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-report', () => ({
  useSadhanaReport: useSadhanaReportMock,
}))

vi.mock('@/application/sadhana/use-sadhana-streak', () => ({
  useSadhanaStreak: useSadhanaStreakMock,
}))

function renderCard() {
  return render(
    <MemoryRouter>
      <TodaySadhanaCard />
    </MemoryRouter>,
  )
}

describe('TodaySadhanaCard', () => {
  beforeEach(() => {
    useSadhanaReportMock.mockReset()
    useSadhanaStreakMock.mockReset()
    useSadhanaStreakMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: 3,
    })
  })

  it('shows a loading state', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    renderCard()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    renderCard()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows "not completed" and a Fill Sadhana CTA when there is no report today', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderCard()

    expect(
      screen.getByText(/haven't logged today's sadhana yet/i),
    ).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /fill sadhana/i })
    expect(cta).toHaveAttribute('href', '/sadhana')
  })

  it('shows completion status, metrics, and an Edit Sadhana CTA when a report exists', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'report-1',
        totalRounds: 16,
        readingMinutes: 15,
        hearingMinutes: 30,
      },
    })

    renderCard()

    expect(screen.getByText(/is saved/i)).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText('15 min')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /edit sadhana/i })
    expect(cta).toHaveAttribute('href', '/sadhana')
  })

  it('shows the current streak', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })
    useSadhanaStreakMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: 5,
    })

    renderCard()

    expect(screen.getByText(/current streak: 5 days/i)).toBeInTheDocument()
  })
})
