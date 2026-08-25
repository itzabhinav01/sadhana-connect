import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { MentorDevoteeSummary } from '@sadhana-connect/mentor'
import { MentorSummaryCards } from '@/presentation/pages/mentor/MentorSummaryCards'

function makeSummary(overrides: Partial<MentorDevoteeSummary>): MentorDevoteeSummary {
  return {
    devoteeId: 'd1',
    fullName: 'Devotee',
    assignedAt: '2025-01-01T00:00:00.000Z',
    hasSubmittedToday: false,
    todayTotalRounds: null,
    lastReportDate: null,
    ...overrides,
  }
}

describe('MentorSummaryCards', () => {
  it('computes total assigned, submitted today, and pending today from the summaries', () => {
    const summaries = [
      makeSummary({ devoteeId: 'd1', hasSubmittedToday: true }),
      makeSummary({ devoteeId: 'd2', hasSubmittedToday: true }),
      makeSummary({ devoteeId: 'd3', hasSubmittedToday: false }),
    ]

    render(<MentorSummaryCards summaries={summaries} />)

    expect(screen.getByText('Total Assigned')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Submitted Today')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Pending Today')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders zeros for an empty summaries list', () => {
    render(<MentorSummaryCards summaries={[]} />)

    expect(screen.getAllByText('0')).toHaveLength(3)
  })
})
