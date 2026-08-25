import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WeeklySummaryCard } from '@/presentation/pages/dashboard/WeeklySummaryCard'

const { useWeeklySadhanaSummaryMock } = vi.hoisted(() => ({
  useWeeklySadhanaSummaryMock: vi.fn(),
}))

vi.mock('@sadhana-connect/sadhana', () => ({
  useWeeklySadhanaSummary: useWeeklySadhanaSummaryMock,
}))

describe('WeeklySummaryCard', () => {
  beforeEach(() => {
    useWeeklySadhanaSummaryMock.mockReset()
  })

  it('shows a loading state', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })

    render(<WeeklySummaryCard />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    })

    render(<WeeklySummaryCard />)

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows "—" for average rounds when there are no submitted days', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        startDate: '2026-01-09',
        endDate: '2026-01-15',
        totalReports: 0,
        averageTotalRounds: 0,
        totalReadingMinutes: 0,
        totalHearingMinutes: 0,
        completionRate: 0,
        chartData: [],
      },
    })

    render(<WeeklySummaryCard />)

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('0 / 7')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows the computed stats for a partial week', () => {
    useWeeklySadhanaSummaryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        startDate: '2026-01-09',
        endDate: '2026-01-15',
        totalReports: 2,
        averageTotalRounds: 12,
        totalReadingMinutes: 30,
        totalHearingMinutes: 60,
        completionRate: 2 / 7,
        chartData: [],
      },
    })

    render(<WeeklySummaryCard />)

    expect(screen.getByText('2 / 7')).toBeInTheDocument()
    expect(screen.getByText('29%')).toBeInTheDocument()
    expect(screen.getByText('12.0')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('60 min')).toBeInTheDocument()
  })
})
