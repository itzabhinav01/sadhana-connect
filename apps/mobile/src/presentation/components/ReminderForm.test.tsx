jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/notifications/src/use-send-reminder', () => {
  class ReminderRateLimitedError extends Error {
    constructor() {
      super('This devotee has already been reminded twice in the last 24 hours.')
      this.name = 'ReminderRateLimitedError'
    }
  }
  return {
    useSendReminder: jest.fn(),
    ReminderRateLimitedError,
  }
})

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { ReminderRateLimitedError, useSendReminder } from '@sadhana-connect/notifications'

import { ReminderForm } from './ReminderForm'

const mockUseSendReminder = useSendReminder as jest.Mock
const mockMutate = jest.fn()

describe('ReminderForm', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseSendReminder.mockReset()
    mockMutate.mockReset()
    mockUseSendReminder.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    })
  })

  it('defaults to generic mode and sends a null message', async () => {
    const { getByRole } = await render(<ReminderForm devoteeId="d1" />)

    await fireEvent.press(getByRole('button', { name: 'Send reminder' }))

    expect(mockMutate).toHaveBeenCalledWith({ devoteeId: 'd1', message: null })
  })

  it('custom mode disables Send until text is entered, then sends the typed message', async () => {
    const { getByRole, getByLabelText } = await render(<ReminderForm devoteeId="d1" />)

    await fireEvent.press(getByRole('button', { name: 'Custom message' }))
    const sendButton = getByRole('button', { name: 'Send reminder' })

    await fireEvent.press(sendButton)
    expect(mockMutate).not.toHaveBeenCalled()

    await fireEvent.changeText(
      getByLabelText('Custom reminder message'),
      'Please fill in your report.',
    )
    await fireEvent.press(sendButton)

    expect(mockMutate).toHaveBeenCalledWith({
      devoteeId: 'd1',
      message: 'Please fill in your report.',
    })
  })

  it('shows a success message on success', async () => {
    mockUseSendReminder.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
    })

    const { getByText } = await render(<ReminderForm devoteeId="d1" />)
    expect(getByText('Reminder sent successfully.')).toBeTruthy()
  })

  it('shows the rate-limit message when the error is a ReminderRateLimitedError', async () => {
    mockUseSendReminder.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new ReminderRateLimitedError(),
    })

    const { getByText } = await render(<ReminderForm devoteeId="d1" />)
    expect(
      getByText('This devotee has already been reminded twice in the last 24 hours.'),
    ).toBeTruthy()
  })

  it('shows a generic error fallback for any other error', async () => {
    mockUseSendReminder.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new Error('network down'),
    })

    const { getByText } = await render(<ReminderForm devoteeId="d1" />)
    expect(
      getByText(/something went wrong sending this reminder/i),
    ).toBeTruthy()
  })
})
