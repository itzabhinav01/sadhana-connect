import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ReminderRateLimitedError,
} from '@sadhana-connect/notifications'
import { SendReminderForm } from '@/presentation/components/shared/SendReminderForm'

const { useSendReminderMock } = vi.hoisted(() => ({
  useSendReminderMock: vi.fn(),
}))

vi.mock('@sadhana-connect/notifications', async () => {
  const actual = await vi.importActual<
    typeof import('@sadhana-connect/notifications')
  >('@sadhana-connect/notifications')
  return { ...actual, useSendReminder: useSendReminderMock }
})

describe('SendReminderForm', () => {
  beforeEach(() => {
    useSendReminderMock.mockReset()
    useSendReminderMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })
  })

  it('defaults to generic mode and sends message: null', async () => {
    const mutate = vi.fn()
    useSendReminderMock.mockReturnValue({ mutate, isPending: false, isError: false, isSuccess: false })
    const user = userEvent.setup()

    render(<SendReminderForm devoteeId="devotee-1" />)
    await user.click(screen.getByRole('button', { name: /send reminder/i }))

    expect(mutate).toHaveBeenCalledWith({ devoteeId: 'devotee-1', message: null })
  })

  it('disables sending in custom mode until text is entered', async () => {
    const mutate = vi.fn()
    useSendReminderMock.mockReturnValue({ mutate, isPending: false, isError: false, isSuccess: false })
    const user = userEvent.setup()

    render(<SendReminderForm devoteeId="devotee-1" />)
    await user.click(screen.getByLabelText('Custom message'))

    expect(screen.getByRole('button', { name: /send reminder/i })).toBeDisabled()

    await user.type(screen.getByLabelText('Custom reminder message'), 'Please fill Monday.')
    expect(screen.getByRole('button', { name: /send reminder/i })).not.toBeDisabled()

    await user.click(screen.getByRole('button', { name: /send reminder/i }))
    expect(mutate).toHaveBeenCalledWith({ devoteeId: 'devotee-1', message: 'Please fill Monday.' })
  })

  it('shows a success confirmation after sending', () => {
    useSendReminderMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: true })

    render(<SendReminderForm devoteeId="devotee-1" />)

    expect(screen.getByText('Reminder sent successfully.')).toBeInTheDocument()
  })

  it('shows the exact rate-limit message when rate-limited', () => {
    useSendReminderMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new ReminderRateLimitedError(),
    })

    render(<SendReminderForm devoteeId="devotee-1" />)

    expect(
      screen.getByText('This devotee has already been reminded twice in the last 24 hours.'),
    ).toBeInTheDocument()
  })

  it('shows a generic error message for a non-rate-limit failure', () => {
    useSendReminderMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new Error('boom'),
    })

    render(<SendReminderForm devoteeId="devotee-1" />)

    expect(
      screen.getByText('Something went wrong sending this reminder. Please try again.'),
    ).toBeInTheDocument()
  })
})
