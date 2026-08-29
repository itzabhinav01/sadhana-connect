jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

const mockToggleReminder = jest.fn()
const mockChangeReminderTime = jest.fn()

jest.mock('../hooks/use-daily-sadhana-reminder', () => ({
  useDailySadhanaReminder: () => ({
    isLoading: false,
    enabled: mockEnabled,
    reminderTime: mockReminderTime,
    permissionDenied: mockPermissionDenied,
    toggleReminder: mockToggleReminder,
    changeReminderTime: mockChangeReminderTime,
  }),
}))

let mockEnabled = false
let mockReminderTime = '21:00'
let mockPermissionDenied = false

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { DailySadhanaReminderSection } from './DailySadhanaReminderSection'

describe('DailySadhanaReminderSection', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockEnabled = false
    mockReminderTime = '21:00'
    mockPermissionDenied = false
  })

  it('renders disabled state when reminder is not enabled', async () => {
    const { getByText } = await render(<DailySadhanaReminderSection />)

    expect(getByText('Daily Notification')).toBeTruthy()
    expect(getByText(/Daily reminder is currently disabled/)).toBeTruthy()
  })

  it('renders time presets and active status when enabled', async () => {
    mockEnabled = true
    mockReminderTime = '20:30'

    const { getByText, getByRole } = await render(<DailySadhanaReminderSection />)

    expect(getByRole('button', { name: '8:30 PM' })).toBeTruthy()
    expect(getByRole('button', { name: '9:00 PM' })).toBeTruthy()
    expect(getByText(/Scheduled: You will receive a daily notification at/)).toBeTruthy()
  })

  it('calls toggleReminder when switch is pressed', async () => {
    const { getByLabelText } = await render(<DailySadhanaReminderSection />)

    const toggle = getByLabelText('Toggle daily sadhana reminder')
    fireEvent(toggle, 'valueChange', true)

    expect(mockToggleReminder).toHaveBeenCalledWith(true)
  })

  it('calls changeReminderTime when a preset is pressed', async () => {
    mockEnabled = true

    const { getByText } = await render(<DailySadhanaReminderSection />)

    await fireEvent.press(getByText('9:30 PM'))

    expect(mockChangeReminderTime).toHaveBeenCalledWith('21:30')
  })

  it('shows error banner when permission is denied', async () => {
    mockPermissionDenied = true

    const { getByText } = await render(<DailySadhanaReminderSection />)

    expect(getByText(/Notification permission is required/)).toBeTruthy()
  })
})
