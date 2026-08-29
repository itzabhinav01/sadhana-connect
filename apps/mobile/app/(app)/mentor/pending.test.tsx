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

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useMentorDevotees } from '@sadhana-connect/mentor'

import MentorPendingScreen from './pending'

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

describe('MentorPendingScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseMentorDevotees.mockReset()
    mockPush.mockReset()
  })

  it('shows a loading screen while pending', async () => {
    mockUseMentorDevotees.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined })

    const { getByText } = await render(<MentorPendingScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows only devotees who have not submitted today', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [submittedDevotee, pendingDevotee],
    })

    const { getByText, queryByText } = await render(<MentorPendingScreen />)
    expect(getByText('Pending Devotee')).toBeTruthy()
    expect(queryByText('Submitted Devotee')).toBeNull()
  })

  it('shows a positive empty state when everyone has submitted', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [submittedDevotee],
    })

    const { getByText } = await render(<MentorPendingScreen />)
    expect(getByText('Everyone has submitted today.')).toBeTruthy()
  })

  it('filters by name search', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [pendingDevotee, { ...pendingDevotee, devoteeId: 'd3', fullName: 'Another Devotee' }],
    })

    const { getByLabelText, getByText, queryByText } = await render(<MentorPendingScreen />)
    await fireEvent.changeText(getByLabelText('Search devotees by name'), 'another')

    expect(getByText('Another Devotee')).toBeTruthy()
    expect(queryByText('Pending Devotee')).toBeNull()
  })

  it('navigates to the devotee detail screen on row press', async () => {
    mockUseMentorDevotees.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [pendingDevotee],
    })

    const { getByRole } = await render(<MentorPendingScreen />)
    await fireEvent.press(getByRole('button', { name: 'View Pending Devotee' }))

    expect(mockPush).toHaveBeenCalledWith('/mentor/devotee/d2')
  })
})
