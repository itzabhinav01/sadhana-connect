jest.mock('../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(),
}))

jest.mock('../../src/application/auth/use-sign-out', () => ({
  useSignOut: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}))

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native')
    return <Text>redirect:{href}</Text>
  },
  Stack: () => {
    const { Text } = require('react-native')
    return <Text>app-stack</Text>
  },
  useRouter: () => ({ replace: jest.fn() }),
}))

import { render } from '@testing-library/react-native'
import { useAuth, useProfile } from '@sadhana-connect/auth'

import AppLayout from './_layout'

const mockUseAuth = useAuth as jest.Mock
const mockUseProfile = useProfile as jest.Mock

describe('AppLayout (ProtectedRoute equivalent)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
    mockUseProfile.mockReset()
  })

  it('shows loading while the session is resolving', async () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: true })
    mockUseProfile.mockReturnValue({ isPending: false, data: undefined })

    const { getByText, queryByText } = await render(<AppLayout />)
    expect(getByText('Loading…')).toBeTruthy()
    expect(queryByText(/redirect:/)).toBeNull()
  })

  it('redirects to /login when there is no session', async () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: false })
    mockUseProfile.mockReturnValue({ isPending: false, data: undefined })

    const { getByText } = await render(<AppLayout />)
    expect(getByText('redirect:/login')).toBeTruthy()
  })

  it('shows loading while the profile is pending', async () => {
    mockUseAuth.mockReturnValue({
      session: { userId: 'u1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    mockUseProfile.mockReturnValue({ isPending: true, data: undefined })

    const { getByText } = await render(<AppLayout />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an inline error when the profile fails to load', async () => {
    mockUseAuth.mockReturnValue({
      session: { userId: 'u1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    mockUseProfile.mockReturnValue({ isPending: false, isError: true, data: undefined })

    const { getByText } = await render(<AppLayout />)
    expect(getByText(/something went wrong loading your profile/i)).toBeTruthy()
  })

  it('shows the account-disabled screen when the profile is inactive', async () => {
    mockUseAuth.mockReturnValue({
      session: { userId: 'u1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    mockUseProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: { id: 'u1', fullName: 'Someone', role: 'devotee', templeGroupId: null, isActive: false },
    })

    const { getByText } = await render(<AppLayout />)
    expect(getByText('Account disabled')).toBeTruthy()
  })

  it('renders the app stack when session and active profile are both present', async () => {
    mockUseAuth.mockReturnValue({
      session: { userId: 'u1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    mockUseProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: { id: 'u1', fullName: 'Someone', role: 'devotee', templeGroupId: null, isActive: true },
    })

    const { getByText } = await render(<AppLayout />)
    expect(getByText('app-stack')).toBeTruthy()
  })
})
