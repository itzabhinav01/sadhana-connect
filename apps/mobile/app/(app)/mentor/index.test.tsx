jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/mentor/src/use-mentor-devotees', () => ({
  useMentorDevotees: jest.fn(),
}))

jest.mock('../../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(() => ({
    data: { id: 'm1', fullName: 'Mentor Prabhu', role: 'mentor' },
    isPending: false,
    isError: false,
  })),
}))

jest.mock('../../../src/application/auth/use-sign-out', () => ({
  useSignOut: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}))

const mockPush = jest.fn()
const mockSetOptions = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush, replace: jest.fn() })),
  useNavigation: jest.fn(() => ({ setOptions: mockSetOptions })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useMentorDevotees } from '@sadhana-connect/mentor'

import MentorDashboardScreen from './index'

const mockUseMentorDevotees = useMentorDevotees as jest.Mock

const submittedDevotee = {
  devoteeId: 'd1',
  fullName: 'Submitted Devotee',
  assignedAt: '2025-01-01T00:00:00.000Z',
  hasSubmittedToday: true,
  todayTotalRounds: 16,
  lastReportDate: '2026-01-15',
}

const pendingDevotee = {
  devoteeId: 'd2',
  fullName: 'Pending Devotee',
  assignedAt: '2025-01-01T00:00:00.000Z',
  hasSubmittedToday: false,
  todayTotalRounds: null,
  lastReportDate: null,
}

describe('MentorDashboardScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseMentorDevotees.mockReset()
    mockPush.mockReset()
  })

  it('shows a loading screen while pending', async () => {
    mockUseMentorDevotees.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined })

    const { getByText } = await render(<MentorDashboardScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error state on failure', async () => {
    mockUseMentorDevotees.mockReturnValue({ isPending: false, isError: true, isSuccess: false, data: undefined })

    const { getByText } = await render(<MentorDashboardScreen />)
    expect(getByText(/something went wrong loading your devotees/i)).toBeTruthy()
  })

  it('shows an empty state when there are zero assigned devotees', async () => {
    mockUseMentorDevotees.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })

    const { getByText } = await render(<MentorDashboardScreen />)
    expect(getByText('No devotees are currently assigned to you.')).toBeTruthy()
  })

  it('renders summary counts and the devotee list', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [submittedDevotee, pendingDevotee],
    })

    const { getByText } = await render(<MentorDashboardScreen />)
    expect(getByText('Total Assigned')).toBeTruthy()
    expect(getByText('2')).toBeTruthy()
    expect(getByText('Submitted Devotee')).toBeTruthy()
    expect(getByText('Pending Devotee')).toBeTruthy()
  })

  it('filters the list to only pending devotees when "Pending Today" is selected', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [submittedDevotee, pendingDevotee],
    })

    const { getByRole, getByText, queryByText } = await render(<MentorDashboardScreen />)
    await fireEvent.press(getByRole('button', { name: 'Pending Today' }))

    expect(getByText('Pending Devotee')).toBeTruthy()
    expect(queryByText('Submitted Devotee')).toBeNull()
  })

  it('filters the list by name search', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [submittedDevotee, pendingDevotee],
    })

    const { getByLabelText, getByText, queryByText } = await render(<MentorDashboardScreen />)
    await fireEvent.changeText(getByLabelText('Search devotees by name'), 'pending')

    expect(getByText('Pending Devotee')).toBeTruthy()
    expect(queryByText('Submitted Devotee')).toBeNull()
  })

  it('navigates to the devotee detail screen on row press', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [submittedDevotee],
    })

    const { getByRole } = await render(<MentorDashboardScreen />)
    await fireEvent.press(getByRole('button', { name: 'View Submitted Devotee' }))

    expect(mockPush).toHaveBeenCalledWith('/mentor/devotee/d1')
  })
})
