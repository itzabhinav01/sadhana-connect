jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(() => ({
    session: { userId: 'user-1', email: 'devotee@example.com' },
    isLoading: false,
  })),
}))

jest.mock('../../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(),
}))

jest.mock('../../../../../packages/sadhana/src/use-sadhana-streak', () => ({
  useSadhanaStreak: jest.fn(),
}))

jest.mock('../../../../../packages/sadhana/src/use-recent-sadhana-reports', () => ({
  useRecentSadhanaReports: jest.fn(),
  RECENT_REPORTS_LOOKBACK_LIMIT: 60,
}))

jest.mock('../../../src/application/profile/use-update-profile', () => ({
  useUpdateProfile: jest.fn(),
}))

jest.mock('../../../src/application/auth/use-sign-out', () => ({
  useSignOut: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}))

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Stack: { Screen: () => <View /> },
    useRouter: jest.fn(() => ({ push: mockPush, replace: mockReplace })),
  }
})

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { useProfile } from '@sadhana-connect/auth'
import { useRecentSadhanaReports, useSadhanaStreak } from '@sadhana-connect/sadhana'

import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { useUpdateProfile } from '../../../src/application/profile/use-update-profile'
import ProfileScreen from './profile'

const mockUseProfile = useProfile as jest.Mock
const mockUseUpdateProfile = useUpdateProfile as jest.Mock
const mockUseSadhanaStreak = useSadhanaStreak as jest.Mock
const mockUseRecentSadhanaReports = useRecentSadhanaReports as jest.Mock
const mockUseSignOut = useSignOut as jest.Mock
const mockMutate = jest.fn()

const activeProfile = {
  id: 'user-1',
  fullName: 'User One',
  role: 'devotee' as const,
  templeGroupId: null,
  isActive: true,
  phoneNumber: '+919876543210',
}

describe('ProfileScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseProfile.mockReset()
    mockUseUpdateProfile.mockReset()
    mockMutate.mockReset()
    mockPush.mockReset()
    mockReplace.mockReset()
    mockUseUpdateProfile.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    })
    mockUseSadhanaStreak.mockReturnValue({ data: 5 })
    mockUseRecentSadhanaReports.mockReturnValue({ data: [{ id: 'r1' }, { id: 'r2' }] })
    mockUseSignOut.mockReturnValue({ mutate: jest.fn(), isPending: false })
  })

  it('shows a loading state while the profile is pending', async () => {
    mockUseProfile.mockReturnValue({ isPending: true, isError: false, data: undefined })

    const { getByText } = await render(<ProfileScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error state when the profile fails to load', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: true, data: undefined })

    const { getByText } = await render(<ProfileScreen />)
    expect(getByText(/something went wrong loading your profile/i)).toBeTruthy()
  })

  it('shows the devotee identity header, email, phone, and streak stats', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByText, getAllByText } = await render(<ProfileScreen />)
    expect(getAllByText('User One').length).toBeGreaterThan(0)
    expect(getAllByText('Devotee').length).toBeGreaterThan(0)
    expect(getByText('devotee@example.com')).toBeTruthy()
    expect(getByText('+919876543210')).toBeTruthy()
    expect(getByText('5')).toBeTruthy()
    expect(getByText('2')).toBeTruthy()
  })

  it('opens edit modal and saves updated profile on success', async () => {
    mockMutate.mockImplementation((_value, options) => {
      options?.onSuccess?.()
    })
    mockUseProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    const { getByText, getByPlaceholderText } = await render(<ProfileScreen />)

    await fireEvent.press(getByText('Edit Profile'))
    await fireEvent.changeText(getByPlaceholderText('Enter your name'), 'Updated Name')
    await fireEvent.changeText(getByPlaceholderText('+919876543210'), '+919999999999')
    await fireEvent.press(getByText('Save Changes'))

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { fullName: 'Updated Name', phoneNumber: '+919999999999' },
        expect.anything(),
      ),
    )
  })

  it('navigates to /devotee/settings when "Settings & Reminders" is pressed', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByText } = await render(<ProfileScreen />)
    await fireEvent.press(getByText('Settings & Reminders'))

    expect(mockPush).toHaveBeenCalledWith('/devotee/settings')
  })

  it('signs out and redirects to /login when "Sign Out" is pressed', async () => {
    const signOutMutate = jest.fn((_arg, options) => options?.onSuccess?.())
    mockUseSignOut.mockReturnValue({ mutate: signOutMutate, isPending: false })
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByText } = await render(<ProfileScreen />)
    await fireEvent.press(getByText('Sign Out'))

    expect(signOutMutate).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })
})
