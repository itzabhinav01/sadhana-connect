import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChartSkeleton } from '@/presentation/components/ChartSkeleton'

describe('ChartSkeleton', () => {
  it('renders the given title and an accessible loading status', () => {
    render(<ChartSkeleton title="Weekly Rounds" />)

    expect(
      screen.getByRole('heading', { name: 'Weekly Rounds' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'Loading Weekly Rounds chart' }),
    ).toBeInTheDocument()
  })
})
