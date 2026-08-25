jest.mock('../../../../../packages/sadhana/src/use-sadhana-report', () => ({
  useSadhanaReport: jest.fn(),
}))

jest.mock('../../../../../packages/sadhana/src/use-sadhana-streak', () => ({
  useSadhanaStreak: jest.fn(),
}))

jest.mock('../../../../../packages/sadhana/src/use-weekly-sadhana-summary', () => ({
  useWeeklySadhanaSummary: jest.fn(),
}))

jest.mock('../../../../../packages/sadhana/src/use-recent-sadhana-reports', () => ({
  useRecentSadhanaReports: jest.fn(),
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
import {
  useRecentSadhanaReports,
  useSadhanaReport,
  useSadhanaStreak,
  useWeeklySadhanaSummary,
} from '@sadhana-connect/sadhana'

import DashboardScreen from './index'

const mockUseSadhanaReport = useSadhanaReport as jest.Mock
const mockUseSadhanaStreak = useSadhanaStreak as jest.Mock
const mockUseWeeklySadhanaSummary = useWeeklySadhanaSummary as jest.Mock
const mockUseRecentSadhanaReports = useRecentSadhanaReports as jest.Mock

describe('DashboardScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseSadhanaStreak.mockReturnValue({ data: 0 })
    mockUseWeeklySadhanaSummary.mockReturnValue({ data: undefined })
    mockUseRecentSadhanaReports.mockReturnValue({ data: [] })
  })

  it('shows a loading screen while the report query is pending', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: true, data: undefined })

    const { getByText } = await render(<DashboardScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows "Fill Sadhana" when there is no report for today', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })

    const { getByRole, getByText } = await render(<DashboardScreen />)
    expect(getByText("You haven't logged today's sadhana yet.")).toBeTruthy()
    expect(getByRole('button', { name: 'Fill Sadhana' })).toBeTruthy()
  })

  it("shows today's totals and an Edit action when a report exists", async () => {
    mockUseSadhanaReport.mockReturnValue({
      isPending: false,
      data: {
        id: 'r1',
        totalRounds: 16,
        readingMinutes: 20,
        hearingMinutes: 15,
      },
    })
    mockUseSadhanaStreak.mockReturnValue({ data: 3 })

    const { getByRole, getByText } = await render(<DashboardScreen />)
    expect(getByText('Current streak: 3 days')).toBeTruthy()
    expect(getByText('16')).toBeTruthy()
    expect(getByRole('button', { name: 'Edit Sadhana' })).toBeTruthy()
  })

  it('shows the empty state for Recent Reports when there are none yet', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })

    const { getByText } = await render(<DashboardScreen />)
    expect(getByText('No reports yet — your submissions will show up here.')).toBeTruthy()
  })
})
