import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { calculateJapaProgress } from '@/application/japa/japa-progress'
import { JapaTapButton } from '@/presentation/pages/japa/JapaTapButton'

describe('JapaTapButton', () => {
  it('is a real, keyboard-activatable button', () => {
    render(
      <JapaTapButton progress={calculateJapaProgress(0, 16)} onTap={vi.fn()} />,
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has an aria-label reflecting the current round and bead', () => {
    render(
      <JapaTapButton
        progress={calculateJapaProgress(42, 16)}
        onTap={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: /round 1, bead 42 of 108/i,
      }),
    ).toBeInTheDocument()
  })

  it('updates the aria-label after a round completes', () => {
    render(
      <JapaTapButton
        progress={calculateJapaProgress(109, 16)}
        onTap={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: /round 2, bead 1 of 108/i,
      }),
    ).toBeInTheDocument()
  })

  it('calls onTap when clicked', async () => {
    const onTap = vi.fn()
    const user = userEvent.setup()
    render(<JapaTapButton progress={calculateJapaProgress(0, 16)} onTap={onTap} />)

    await user.click(screen.getByRole('button'))

    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('activates on Enter/Space via native button behavior', async () => {
    const onTap = vi.fn()
    const user = userEvent.setup()
    render(<JapaTapButton progress={calculateJapaProgress(0, 16)} onTap={onTap} />)

    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')

    expect(onTap).toHaveBeenCalledTimes(1)
  })
})
