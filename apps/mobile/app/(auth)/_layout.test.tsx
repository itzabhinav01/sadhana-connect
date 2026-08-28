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

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native')
    return <Text>redirect:{href}</Text>
  },
  Stack: () => {
    const { Text } = require('react-native')
    return <Text>auth-stack</Text>
  },
}))

import { render } from '@testing-library/react-native'
import { useAuth } from '@sadhana-connect/auth'

import AuthLayout from './_layout'

const mockUseAuth = useAuth as jest.Mock

describe('AuthLayout (PublicOnlyRoute equivalent)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('shows loading while the session is resolving', async () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: true })

    const { getByText, queryByText } = await render(<AuthLayout />)
    expect(getByText('Loading…')).toBeTruthy()
    expect(queryByText(/redirect:/)).toBeNull()
  })

  it('redirects to / when a session already exists', async () => {
    mockUseAuth.mockReturnValue({
      session: { userId: 'u1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })

    const { getByText } = await render(<AuthLayout />)
    expect(getByText('redirect:/')).toBeTruthy()
  })

  it('renders the auth stack when there is no session', async () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: false })

    const { getByText } = await render(<AuthLayout />)
    expect(getByText('auth-stack')).toBeTruthy()
  })
})
