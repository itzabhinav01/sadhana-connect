import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MentorDevoteeFilterTabs } from '@/presentation/pages/mentor/MentorDevoteeFilterTabs'

describe('MentorDevoteeFilterTabs', () => {
  it('renders exactly All, Submitted Today, and Pending Today — no other filters', () => {
    render(<MentorDevoteeFilterTabs filter="all" onFilterChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Submitted Today' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pending Today' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('marks the active filter as selected', () => {
    render(<MentorDevoteeFilterTabs filter="pending" onFilterChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Pending Today' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('calls onFilterChange with the clicked filter', async () => {
    const onFilterChange = vi.fn()
    const user = userEvent.setup()
    render(<MentorDevoteeFilterTabs filter="all" onFilterChange={onFilterChange} />)

    await user.click(screen.getByRole('tab', { name: 'Submitted Today' }))

    expect(onFilterChange).toHaveBeenCalledWith('submitted')
  })
})
