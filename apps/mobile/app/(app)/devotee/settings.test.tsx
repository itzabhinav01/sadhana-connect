const mockSetTheme = jest.fn()

jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: mockSetTheme,
  }),
}))

jest.mock('../../../src/presentation/components/DailySadhanaReminderSection', () => {
  const { Text } = require('react-native')
  return {
    DailySadhanaReminderSection: () => <Text>Daily Sadhana Reminder Section</Text>,
  }
})

import { cleanup, fireEvent, render } from '@testing-library/react-native'

import SettingsScreen from './settings'

describe('SettingsScreen', () => {
  afterEach(async () => {
    await cleanup()
    mockSetTheme.mockReset()
  })

  it('shows appearance options, reminder section, and current app version', async () => {
    const { getByRole, getByText } = await render(<SettingsScreen />)
    expect(getByRole('button', { name: 'Light' })).toBeTruthy()
    expect(getByRole('button', { name: 'Dark' })).toBeTruthy()
    expect(getByRole('button', { name: 'System' })).toBeTruthy()
    expect(getByText('Daily Sadhana Reminder Section')).toBeTruthy()
    expect(getByText('Version')).toBeTruthy()
  })

  it('calls setTheme when an appearance option is pressed', async () => {
    const { getByRole } = await render(<SettingsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Dark' }))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
