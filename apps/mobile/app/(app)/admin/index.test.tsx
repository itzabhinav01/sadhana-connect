jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../src/application/auth/use-sign-out', () => ({
  useSignOut: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}))

jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Stack: { Screen: () => <View /> },
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  }
})

import { cleanup, render } from '@testing-library/react-native'

import AdminHomeScreen from './index'

describe('AdminHomeScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('renders navigation entry points for Users, Assignments, and Temple Groups', async () => {
    const { getByRole } = await render(<AdminHomeScreen />)
    expect(getByRole('button', { name: 'Manage Users' })).toBeTruthy()
    expect(getByRole('button', { name: 'Manage Assignments' })).toBeTruthy()
    expect(getByRole('button', { name: 'Manage Temple Groups' })).toBeTruthy()
  })
})
