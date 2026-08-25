import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { MentorDevoteeSummary } from '@sadhana-connect/mentor'
import { MentorDevoteeList } from '@/presentation/pages/mentor/MentorDevoteeList'

const summaries: MentorDevoteeSummary[] = [
  {
    devoteeId: 'd1',
    fullName: 'Devotee One',
    assignedAt: '2025-01-01T00:00:00.000Z',
    hasSubmittedToday: true,
    todayTotalRounds: 16,
    lastReportDate: '2026-01-15',
  },
  {
    devoteeId: 'd2',
    fullName: 'Devotee Two',
    assignedAt: '2025-02-01T00:00:00.000Z',
    hasSubmittedToday: false,
    todayTotalRounds: null,
    lastReportDate: null,
  },
]

function renderList() {
  return render(
    <MemoryRouter>
      <MentorDevoteeList summaries={summaries} />
    </MemoryRouter>,
  )
}

describe('MentorDevoteeList', () => {
  it('renders every devotee name', () => {
    renderList()

    expect(screen.getAllByText('Devotee One').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Devotee Two').length).toBeGreaterThan(0)
  })

  it('shows Submitted/Pending status matching each devotee', () => {
    renderList()

    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
  })

  it('shows "No reports yet" for a devotee with no last report date', () => {
    renderList()

    expect(screen.getAllByText('No reports yet').length).toBeGreaterThan(0)
  })

  it('links each devotee to their own /mentor/devotee/:id detail page', () => {
    renderList()

    const links = screen.getAllByRole('link').filter((link) =>
      link.getAttribute('href')?.startsWith('/mentor/devotee/'),
    )
    const hrefs = links.map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/mentor/devotee/d1')
    expect(hrefs).toContain('/mentor/devotee/d2')
  })

  it('renders no edit or delete action anywhere — mentors are read-only', () => {
    renderList()

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument()
  })
})
