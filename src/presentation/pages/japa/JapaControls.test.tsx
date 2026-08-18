import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { JapaControls } from '@/presentation/pages/japa/JapaControls'

describe('JapaControls', () => {
  it('disables Undo when there is nothing to undo', () => {
    render(
      <JapaControls
        target={16}
        canUndo={false}
        onUndo={vi.fn()}
        onReset={vi.fn()}
        onTargetChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled()
  })

  it('calls onUndo when Undo is clicked and enabled', async () => {
    const onUndo = vi.fn()
    const user = userEvent.setup()
    render(
      <JapaControls
        target={16}
        canUndo
        onUndo={onUndo}
        onReset={vi.fn()}
        onTargetChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /undo/i }))

    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('requires confirmation before reset actually fires', async () => {
    const onReset = vi.fn()
    const user = userEvent.setup()
    render(
      <JapaControls
        target={16}
        canUndo
        onUndo={vi.fn()}
        onReset={onReset}
        onTargetChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    expect(onReset).not.toHaveBeenCalled()
    expect(screen.getByText(/reset today's count\?/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('cancel leaves the count untouched and dismisses the confirmation', async () => {
    const onReset = vi.fn()
    const user = userEvent.setup()
    render(
      <JapaControls
        target={16}
        canUndo
        onUndo={vi.fn()}
        onReset={onReset}
        onTargetChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onReset).not.toHaveBeenCalled()
    expect(
      screen.queryByText(/reset today's count\?/i),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^reset$/i })).toBeInTheDocument()
  })

  it('calls onTargetChange with a valid new target as it is typed', async () => {
    const onTargetChange = vi.fn()
    const user = userEvent.setup()
    render(
      <JapaControls
        target={16}
        canUndo
        onUndo={vi.fn()}
        onReset={vi.fn()}
        onTargetChange={onTargetChange}
      />,
    )

    const input = screen.getByLabelText(/daily target/i)
    await user.clear(input)
    await user.type(input, '32')

    expect(onTargetChange).toHaveBeenLastCalledWith(32)
  })

  it('reverts to the last valid target on blur if left invalid', async () => {
    const onTargetChange = vi.fn()
    const user = userEvent.setup()
    render(
      <JapaControls
        target={16}
        canUndo
        onUndo={vi.fn()}
        onReset={vi.fn()}
        onTargetChange={onTargetChange}
      />,
    )

    const input = screen.getByLabelText(/daily target/i)
    await user.clear(input)
    await user.tab()

    expect(input).toHaveValue(16)
  })
})
