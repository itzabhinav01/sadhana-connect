jest.mock('../../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(() => ({
    session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
    isLoading: false,
  })),
}))

jest.mock('../../../../../../packages/mentor/src/use-devotee-profile', () => ({
  useDevoteeProfile: jest.fn(),
}))

jest.mock('../../../../../../packages/mentor/src/use-devotee-today-report', () => ({
  useDevoteeTodayReport: jest.fn(),
}))

jest.mock('../../../../../../packages/mentor/src/use-devotee-assigned-since', () => ({
  useDevoteeAssignedSince: jest.fn(),
}))

jest.mock('../../../../../../packages/sadhana/src/use-devotee-report-history', () => ({
  useDevoteeReportHistory: jest.fn(),
}))

jest.mock('../../../../../../packages/comments/src/use-sadhana-report-comments', () => ({
  useSadhanaReportComments: jest.fn(),
}))

jest.mock('../../../../../../packages/comments/src/use-add-comment', () => ({
  useAddComment: jest.fn(),
}))

jest.mock('../../../../../../packages/notifications/src/use-send-reminder', () => ({
  useSendReminder: jest.fn(),
  ReminderRateLimitedError: class ReminderRateLimitedError extends Error {},
}))

jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Stack: { Screen: () => <View /> },
    useLocalSearchParams: jest.fn(() => ({ id: 'd1' })),
  }
})

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  useDevoteeAssignedSince,
  useDevoteeProfile,
  useDevoteeTodayReport,
} from '@sadhana-connect/mentor'
import { getLastNDaysRange, useDevoteeReportHistory } from '@sadhana-connect/sadhana'
import { useAddComment, useSadhanaReportComments } from '@sadhana-connect/comments'
import { useSendReminder } from '@sadhana-connect/notifications'

import MentorDevoteeDetailScreen from './[id]'

const mockUseDevoteeProfile = useDevoteeProfile as jest.Mock
const mockUseDevoteeTodayReport = useDevoteeTodayReport as jest.Mock
const mockUseDevoteeAssignedSince = useDevoteeAssignedSince as jest.Mock
const mockUseDevoteeReportHistory = useDevoteeReportHistory as jest.Mock
const mockUseSadhanaReportComments = useSadhanaReportComments as jest.Mock
const mockUseAddComment = useAddComment as jest.Mock
const mockUseSendReminder = useSendReminder as jest.Mock

const idlePending = { isPending: true, isError: false, isSuccess: false, data: undefined }
const idleSuccessEmpty = { isPending: false, isError: false, isSuccess: true, data: null }
const idleSuccessList = { isPending: false, isError: false, isSuccess: true, data: [] }

const activeProfile = {
  id: 'd1',
  fullName: 'Devotee One',
  role: 'devotee' as const,
  templeGroupId: null,
  isActive: true,
  phoneNumber: null,
}

describe('MentorDevoteeDetailScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseDevoteeProfile.mockReset()
    mockUseDevoteeTodayReport.mockReset()
    mockUseDevoteeAssignedSince.mockReset()
    mockUseDevoteeReportHistory.mockReset()
    mockUseSadhanaReportComments.mockReset()
    mockUseAddComment.mockReset()
    mockUseSendReminder.mockReset()
    mockUseDevoteeTodayReport.mockReturnValue(idleSuccessEmpty)
    mockUseDevoteeReportHistory.mockReturnValue(idleSuccessList)
    mockUseDevoteeAssignedSince.mockReturnValue({ ...idleSuccessEmpty, data: null })
    mockUseAddComment.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockUseSendReminder.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    })
  })

  it('shows a loading state while the profile is pending', async () => {
    mockUseDevoteeProfile.mockReturnValue(idlePending)

    const { getByText } = await render(<MentorDevoteeDetailScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error state on a genuine query failure', async () => {
    mockUseDevoteeProfile.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    const { getByText } = await render(<MentorDevoteeDetailScreen />)
    expect(getByText(/something went wrong loading this devotee/i)).toBeTruthy()
  })

  it('shows the generic "not available" state when the profile is null', async () => {
    mockUseDevoteeProfile.mockReturnValue(idleSuccessEmpty)

    const { getByText } = await render(<MentorDevoteeDetailScreen />)
    expect(getByText("This devotee isn't available.")).toBeTruthy()
  })

  it('renders the devotee name, assignment date, and "not submitted" state', async () => {
    mockUseDevoteeProfile.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: activeProfile,
    })
    mockUseDevoteeAssignedSince.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: '2025-01-01T00:00:00.000Z',
    })

    const { getByText } = await render(<MentorDevoteeDetailScreen />)
    expect(getByText('Devotee One')).toBeTruthy()
    expect(getByText(/Assigned since/)).toBeTruthy()
    expect(getByText('Not submitted yet today.')).toBeTruthy()
  })

  it("renders today's report when one exists", async () => {
    mockUseDevoteeProfile.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: activeProfile,
    })
    mockUseDevoteeTodayReport.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { id: 'r1', reportDate: '2026-01-15', totalRounds: 16, readingMinutes: 20, hearingMinutes: 10 },
    })

    const { getByText } = await render(<MentorDevoteeDetailScreen />)
    expect(getByText(/16 rounds · 20m reading · 10m hearing/)).toBeTruthy()
  })

  it('shows the missed-days summary and re-queries when a different preset is selected', async () => {
    mockUseDevoteeProfile.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: activeProfile,
    })
    mockUseDevoteeReportHistory.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [{ id: 'r1', reportDate: '2026-01-15', totalRounds: 16, readingMinutes: 20, hearingMinutes: 10 }],
    })

    const { getByRole, getByText } = await render(<MentorDevoteeDetailScreen />)
    expect(getByText(/Missed \d+ of 7 days/)).toBeTruthy()

    await fireEvent.press(getByRole('button', { name: 'Last 30 days' }))

    const expected = getLastNDaysRange(30)
    expect(mockUseDevoteeReportHistory).toHaveBeenLastCalledWith(
      'd1',
      expected.fromDate,
      expected.toDate,
      { enabled: true },
    )
  })

  it('shows the reminder form on the screen', async () => {
    mockUseDevoteeProfile.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: activeProfile,
    })

    const { getByText } = await render(<MentorDevoteeDetailScreen />)
    expect(getByText('Send a reminder')).toBeTruthy()
  })

  it('expands the comment thread on a report row when its Comments toggle is pressed', async () => {
    mockUseDevoteeProfile.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: activeProfile,
    })
    mockUseDevoteeTodayReport.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { id: 'r1', reportDate: '2026-01-15', totalRounds: 16, readingMinutes: 20, hearingMinutes: 10 },
    })
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    const { getByRole, getByText } = await render(<MentorDevoteeDetailScreen />)

    await fireEvent.press(getByRole('button', { name: 'Comments' }))

    expect(getByText('No comments yet.')).toBeTruthy()
    expect(getByRole('button', { name: 'Hide comments' })).toBeTruthy()
  })
})
