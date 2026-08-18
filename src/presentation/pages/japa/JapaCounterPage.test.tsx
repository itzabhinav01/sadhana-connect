import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JapaCounterPage } from '@/presentation/pages/japa/JapaCounterPage'

const { useJapaCounterMock, tapMock, undoMock, resetMock, setTargetMock } =
  vi.hoisted(() => ({
    useJapaCounterMock: vi.fn(),
    tapMock: vi.fn(),
    undoMock: vi.fn(),
    resetMock: vi.fn(),
    setTargetMock: vi.fn(),
  }))

vi.mock('@/application/japa/use-japa-counter', () => ({
  useJapaCounter: useJapaCounterMock,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <JapaCounterPage />
    </MemoryRouter>,
  )
}

describe('JapaCounterPage', () => {
  beforeEach(() => {
    tapMock.mockReset()
    undoMock.mockReset()
    resetMock.mockReset()
    setTargetMock.mockReset()
    useJapaCounterMock.mockReset()
    useJapaCounterMock.mockReturnValue({
      totalTapsToday: 42,
      completedRounds: 0,
      currentRound: 1,
      currentBead: 42,
      targetRounds: 16,
      targetProgress: 0,
      targetReached: false,
      tap: tapMock,
      undo: undoMock,
      reset: resetMock,
      setTarget: setTargetMock,
    })
  })

  it('renders the tap button, progress, and controls', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /round 1, bead 42/i })).toBeInTheDocument()
    expect(screen.getByText('Round 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
  })

  it('does not render the "Use in Sadhana" action before any round completes', () => {
    renderPage()

    expect(
      screen.queryByRole('button', { name: /use today's completed rounds/i }),
    ).not.toBeInTheDocument()
  })

  it('Space triggers a tap when focus is not on an editable field', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.keyboard(' ')

    expect(tapMock).toHaveBeenCalled()
  })

  it('Backspace triggers undo when focus is not on an editable field', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.keyboard('{Backspace}')

    expect(undoMock).toHaveBeenCalled()
  })

  it('does not trigger tap/undo while typing in the target-rounds input', async () => {
    const user = userEvent.setup()
    renderPage()

    const targetInput = screen.getByLabelText(/daily target/i)
    await user.click(targetInput)
    await user.keyboard(' ')
    await user.keyboard('{Backspace}')

    expect(tapMock).not.toHaveBeenCalled()
    expect(undoMock).not.toHaveBeenCalled()
  })

  it('renders without throwing when Screen Wake Lock is unsupported (jsdom has no navigator.wakeLock)', () => {
    expect(() => renderPage()).not.toThrow()
  })
})
