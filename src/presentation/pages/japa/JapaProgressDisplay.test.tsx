import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { calculateJapaProgress } from '@sadhana-connect/japa'
import { JapaProgressDisplay } from '@/presentation/pages/japa/JapaProgressDisplay'

describe('JapaProgressDisplay', () => {
  it('shows the current round and rounds-of-target progress', () => {
    render(<JapaProgressDisplay progress={calculateJapaProgress(220, 16)} />)

    expect(screen.getByText('Round 3')).toBeInTheDocument()
    expect(screen.getByText(/2 of 16 rounds today/i)).toBeInTheDocument()
  })

  it('indicates when the target has been reached', () => {
    render(
      <JapaProgressDisplay progress={calculateJapaProgress(16 * 108, 16)} />,
    )

    expect(screen.getByText(/target reached/i)).toBeInTheDocument()
  })

  it('does not claim the target is reached before it is', () => {
    render(<JapaProgressDisplay progress={calculateJapaProgress(0, 16)} />)

    expect(screen.queryByText(/target reached/i)).not.toBeInTheDocument()
  })
})
