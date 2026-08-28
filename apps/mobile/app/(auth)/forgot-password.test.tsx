jest.mock('../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

import { render } from '@testing-library/react-native'

jest.mock('expo-router', () => {
  const { Text } = require('react-native')
  return {
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <Text>
        link:{href}:{children}
      </Text>
    ),
  }
})

import ForgotPasswordScreen from './forgot-password'

describe('ForgotPasswordScreen', () => {
  it('shows the deferred password-recovery message and a link back to sign in, with no form', async () => {
    const { getByText, queryByLabelText } = await render(<ForgotPasswordScreen />)

    expect(
      getByText(/password recovery by email will be available soon/i),
    ).toBeTruthy()
    expect(getByText(/link:\/login:Back to sign in/)).toBeTruthy()
    expect(queryByLabelText('Email')).toBeNull()
  })
})
