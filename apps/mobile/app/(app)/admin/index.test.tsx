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

jest.mock('../../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(() => ({
    data: { id: 'a1', fullName: 'Super Admin', role: 'super_admin' },
    isPending: false,
    isError: false,
  })),
}))

jest.mock('../../../../../packages/admin/src/use-admin-dashboard-summary', () => ({
  useAdminDashboardSummary: jest.fn(),
}))

jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Stack: { Screen: () => <View /> },
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  }
})

import { cleanup, render } from '@testing-library/react-native'
import { useAdminDashboardSummary } from '@sadhana-connect/admin'

import AdminHomeScreen from './index'

const mockUseAdminDashboardSummary = useAdminDashboardSummary as jest.Mock

const summary = {
  totalDevotees: 10,
  totalMentors: 3,
  activeCount: 8,
  disabledCount: 2,
  anonymizedCount: 0,
  totalTempleGroups: 1,
  devoteesWithoutActiveMentor: 2,
  reportsSubmittedToday: 4,
}

describe('AdminHomeScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAdminDashboardSummary.mockReset()
    mockUseAdminDashboardSummary.mockReturnValue({ isPending: false, isError: false, data: summary })
  })

  it('renders navigation entry points for Users, Assignments, and Temple Groups', async () => {
    const { getByRole } = await render(<AdminHomeScreen />)
    expect(getByRole('button', { name: 'Manage Users' })).toBeTruthy()
    expect(getByRole('button', { name: 'Manage Assignments' })).toBeTruthy()
    expect(getByRole('button', { name: 'Manage Temple Groups' })).toBeTruthy()
  })

  it('renders the platform summary figures', async () => {
    const { getByText } = await render(<AdminHomeScreen />)
    expect(getByText('10')).toBeTruthy()
    expect(getByText('Total devotees')).toBeTruthy()
    expect(getByText('4')).toBeTruthy()
    expect(getByText('Reports submitted today')).toBeTruthy()
  })

  it('shows a loading state while the summary is pending', async () => {
    mockUseAdminDashboardSummary.mockReturnValue({ isPending: true, isError: false, data: undefined })

    const { getByText } = await render(<AdminHomeScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error message when the summary fails to load', async () => {
    mockUseAdminDashboardSummary.mockReturnValue({ isPending: false, isError: true, data: undefined })

    const { getByText } = await render(<AdminHomeScreen />)
    expect(getByText('Something went wrong loading the summary.')).toBeTruthy()
  })
})
