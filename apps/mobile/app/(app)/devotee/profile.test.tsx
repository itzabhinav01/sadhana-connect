jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
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

jest.mock('../../../src/application/profile/use-update-phone-number', () => ({
  useUpdatePhoneNumber: jest.fn(),
}))

jest.mock('../../../src/application/auth/use-sign-out', () => ({
  useSignOut: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}))

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush, replace: mockReplace })),
}))

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { useProfile } from '@sadhana-connect/auth'
import { useRecentSadhanaReports, useSadhanaStreak } from '@sadhana-connect/sadhana'

import { useSignOut } from '../../../src/application/auth/use-sign-out'
import { useUpdatePhoneNumber } from '../../../src/application/profile/use-update-phone-number'
import ProfileScreen from './profile'

const mockUseProfile = useProfile as jest.Mock
const mockUseUpdatePhoneNumber = useUpdatePhoneNumber as jest.Mock
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
    mockUseUpdatePhoneNumber.mockReset()
    mockMutate.mockReset()
    mockPush.mockReset()
    mockReplace.mockReset()
    mockUseUpdatePhoneNumber.mockReturnValue({
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

  it('shows the devotee identity header and streak/report stats', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByText } = await render(<ProfileScreen />)
    expect(getByText('User One')).toBeTruthy()
    expect(getByText('Devotee')).toBeTruthy()
    expect(getByText('5')).toBeTruthy()
    expect(getByText('2')).toBeTruthy()
  })

  it('shows the existing phone number with an Edit action', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByText, getByRole } = await render(<ProfileScreen />)
    expect(getByText('+919876543210')).toBeTruthy()
    expect(getByRole('button', { name: 'Edit' })).toBeTruthy()
  })

  it('shows "Not provided" with an Add action when there is no phone number yet', async () => {
    mockUseProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    const { getByText, getByRole } = await render(<ProfileScreen />)
    expect(getByText('Not provided')).toBeTruthy()
    expect(getByRole('button', { name: 'Add' })).toBeTruthy()
  })

  it('saves a new phone number and returns to the view state on success', async () => {
    mockMutate.mockImplementation((_value, options) => {
      options?.onSuccess?.()
    })
    mockUseProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    const { getByRole, getByPlaceholderText } = await render(<ProfileScreen />)

    await fireEvent.press(getByRole('button', { name: 'Add' }))
    await fireEvent.changeText(getByPlaceholderText('+919876543210'), '+919876543210')
    await fireEvent.press(getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith('+919876543210', expect.anything()),
    )
    await waitFor(() => expect(getByRole('button', { name: 'Add' })).toBeTruthy())
  })

  it('does not submit an invalid phone number', async () => {
    mockUseProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    const { getByRole, getByPlaceholderText } = await render(<ProfileScreen />)

    await fireEvent.press(getByRole('button', { name: 'Add' }))
    await fireEvent.changeText(getByPlaceholderText('+919876543210'), '12345')
    await fireEvent.press(getByRole('button', { name: 'Save' }))

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('discards edits when Cancel is pressed', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByRole, getByPlaceholderText, getByText } = await render(<ProfileScreen />)

    await fireEvent.press(getByRole('button', { name: 'Edit' }))
    await fireEvent.changeText(getByPlaceholderText('+919876543210'), '+911111111111')
    await fireEvent.press(getByRole('button', { name: 'Cancel' }))

    expect(getByText('+919876543210')).toBeTruthy()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows an inline error in the edit form when the update failed', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })
    mockUseUpdatePhoneNumber.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
    })

    const { getByRole, getByText } = await render(<ProfileScreen />)

    await fireEvent.press(getByRole('button', { name: 'Edit' }))

    expect(getByText(/something went wrong saving your phone number/i)).toBeTruthy()
  })

  it('navigates to /devotee/settings when "Settings" is pressed', async () => {
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByRole } = await render(<ProfileScreen />)
    await fireEvent.press(getByRole('button', { name: 'Settings' }))

    expect(mockPush).toHaveBeenCalledWith('/devotee/settings')
  })

  it('signs out and redirects to /login when "Sign Out" is pressed', async () => {
    const signOutMutate = jest.fn((_arg, options) => options?.onSuccess?.())
    mockUseSignOut.mockReturnValue({ mutate: signOutMutate, isPending: false })
    mockUseProfile.mockReturnValue({ isPending: false, isError: false, data: activeProfile })

    const { getByRole } = await render(<ProfileScreen />)
    await fireEvent.press(getByRole('button', { name: 'Sign Out' }))

    expect(signOutMutate).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })
})
