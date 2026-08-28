jest.mock('../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../packages/auth/src/use-sign-in', () => ({
  useSignIn: jest.fn(),
}))

jest.mock('expo-router', () => {
  const { Text } = require('react-native')
  return {
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <Text>
        link:{href}:{children}
      </Text>
    ),
    useRouter: jest.fn(),
  }
})

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { useSignIn } from '@sadhana-connect/auth'
import { useRouter } from 'expo-router'

import LoginScreen from './login'

const mockUseSignIn = useSignIn as jest.Mock
const mockUseRouter = useRouter as jest.Mock

describe('LoginScreen', () => {
  let mockReplace: jest.Mock

  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseSignIn.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false, error: null })
    mockReplace = jest.fn()
    mockUseRouter.mockReturnValue({ replace: mockReplace })
  })

  it('shows the deferred password-recovery message instead of a reset link', async () => {
    const { getByText, queryByText } = await render(<LoginScreen />)
    expect(getByText(/password recovery by email will be available soon/i)).toBeTruthy()
    expect(queryByText(/link:\/forgot-password/)).toBeNull()
  })

  it('submits valid credentials and navigates home on success', async () => {
    const mutate = jest.fn((_values, { onSuccess }: { onSuccess: () => void }) => onSuccess())
    mockUseSignIn.mockReturnValue({ mutate, isPending: false, isError: false, error: null })

    const { getByLabelText, getByRole } = await render(<LoginScreen />)
    await fireEvent.changeText(getByLabelText('Email'), 'devotee@example.com')
    await fireEvent.changeText(getByLabelText('Password'), 'password123')
    await fireEvent.press(getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(mutate).toHaveBeenCalled())
    expect(mutate.mock.calls[0][0]).toEqual({
      email: 'devotee@example.com',
      password: 'password123',
    })
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('does not submit when the email is invalid', async () => {
    const mutate = jest.fn()
    mockUseSignIn.mockReturnValue({ mutate, isPending: false, isError: false, error: null })

    const { getByLabelText, getByRole, findByText } = await render(<LoginScreen />)
    await fireEvent.changeText(getByLabelText('Email'), 'not-an-email')
    await fireEvent.changeText(getByLabelText('Password'), 'password123')
    await fireEvent.press(getByRole('button', { name: 'Sign in' }))

    await findByText(/enter a valid email address/i)
    expect(mutate).not.toHaveBeenCalled()
  })
})
