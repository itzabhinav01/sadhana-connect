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

jest.mock('../../../../../packages/notifications/src/use-unread-notification-count', () => ({
  useUnreadNotificationCount: jest.fn(),
}))

jest.mock('../../../src/application/auth/use-sign-out', () => ({
  useSignOut: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}))

const mockPush = jest.fn()

jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Stack: { Screen: () => <View /> },
    useRouter: jest.fn(() => ({ push: mockPush, replace: jest.fn() })),
  }
})

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useUnreadNotificationCount } from '@sadhana-connect/notifications'
import {
  buildWhatsAppShareUrl,
  useRecentSadhanaReports,
  useSadhanaReport,
  useSadhanaStreak,
  useWeeklySadhanaSummary,
} from '@sadhana-connect/sadhana'
import { Linking } from 'react-native'

import DashboardScreen from './index'

const fullTodayReport = {
  id: 'r1',
  profileId: 'user-1',
  reportDate: '2026-08-19',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: '06:30',
  totalRounds: 16,
  readingMinutes: 20,
  bookName: null,
  hearingMinutes: 15,
  speakerName: null,
  sleepTime: '22:00',
  wakeTime: '04:00',
  dayRestMinutes: 0,
  totalRestMinutes: 0,
  officeGoingTime: null,
  officeReturnTime: null,
  notes: null,
  signatureText: 'Test Devotee',
  createdAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-08-19T00:00:00.000Z',
}

const mockUseSadhanaReport = useSadhanaReport as jest.Mock
const mockUseSadhanaStreak = useSadhanaStreak as jest.Mock
const mockUseWeeklySadhanaSummary = useWeeklySadhanaSummary as jest.Mock
const mockUseRecentSadhanaReports = useRecentSadhanaReports as jest.Mock
const mockUseUnreadNotificationCount = useUnreadNotificationCount as jest.Mock

describe('DashboardScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseSadhanaStreak.mockReturnValue({ data: 0 })
    mockUseWeeklySadhanaSummary.mockReturnValue({ data: undefined })
    mockUseRecentSadhanaReports.mockReturnValue({ data: [] })
    mockUseUnreadNotificationCount.mockReturnValue({ data: 0 })
    mockPush.mockReset()
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

  it('opens the correctly formatted WhatsApp share URL when "Share to WhatsApp" is pressed', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: fullTodayReport })
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)

    const { getByRole } = await render(<DashboardScreen />)
    await fireEvent.press(getByRole('button', { name: 'Share to WhatsApp' }))

    expect(openURLSpy).toHaveBeenCalledWith(buildWhatsAppShareUrl(fullTodayReport))
  })

  it('shows the empty state for Recent Reports when there are none yet', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })

    const { getByText } = await render(<DashboardScreen />)
    expect(getByText('No reports yet — your submissions will show up here.')).toBeTruthy()
  })

  it('opens the correctly formatted WhatsApp share URL for a Recent Reports row', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })
    mockUseRecentSadhanaReports.mockReturnValue({ data: [fullTodayReport] })
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)

    const { getByRole } = await render(<DashboardScreen />)
    await fireEvent.press(
      getByRole('button', { name: `Share ${fullTodayReport.reportDate} report to WhatsApp` }),
    )

    expect(openURLSpy).toHaveBeenCalledWith(buildWhatsAppShareUrl(fullTodayReport))
  })

  it('shows a plain "Notifications" label when there are no unread notifications', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })
    mockUseUnreadNotificationCount.mockReturnValue({ data: 0 })

    const { getByRole } = await render(<DashboardScreen />)

    expect(getByRole('button', { name: 'Notifications' })).toBeTruthy()
  })

  it('shows the unread count in the Notifications label when there are unread notifications', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })
    mockUseUnreadNotificationCount.mockReturnValue({ data: 3 })

    const { getByRole } = await render(<DashboardScreen />)

    expect(getByRole('button', { name: 'Notifications (3)' })).toBeTruthy()
  })

  it('navigates to /devotee/notifications when "Notifications" is pressed', async () => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })
    mockUseUnreadNotificationCount.mockReturnValue({ data: 0 })

    const { getByRole } = await render(<DashboardScreen />)
    await fireEvent.press(getByRole('button', { name: 'Notifications' }))

    expect(mockPush).toHaveBeenCalledWith('/devotee/notifications')
  })
})
