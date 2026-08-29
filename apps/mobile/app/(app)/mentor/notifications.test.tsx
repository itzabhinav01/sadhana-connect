jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/notifications/src/use-notifications', () => ({
  useNotifications: jest.fn(),
}))

jest.mock('../../../../../packages/notifications/src/use-mark-notification-read', () => ({
  useMarkNotificationRead: jest.fn(),
}))

jest.mock('../../../../../packages/notifications/src/use-mark-all-notifications-read', () => ({
  useMarkAllNotificationsRead: jest.fn(),
}))

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@sadhana-connect/notifications'

import MentorNotificationsScreen from './notifications'

const mockUseNotifications = useNotifications as jest.Mock
const mockUseMarkNotificationRead = useMarkNotificationRead as jest.Mock
const mockUseMarkAllNotificationsRead = useMarkAllNotificationsRead as jest.Mock

function page(notifications: unknown[]) {
  return { pages: [{ notifications, nextCursor: null }] }
}

function makeNotification(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'n1',
    recipientId: 'mentor-1',
    type: 'announcement',
    title: 'New announcement',
    body: 'Temple closed Monday.',
    relatedAnnouncementId: 'ann-1',
    relatedReportId: null,
    isRead: false,
    readAt: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

describe('MentorNotificationsScreen', () => {
  const markReadMutate = jest.fn()
  const markAllReadMutate = jest.fn()

  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockPush.mockReset()
    markReadMutate.mockReset()
    markAllReadMutate.mockReset()
    mockUseMarkNotificationRead.mockReturnValue({ mutate: markReadMutate })
    mockUseMarkAllNotificationsRead.mockReturnValue({ mutate: markAllReadMutate, isPending: false })
  })

  it('shows the empty state when there are no notifications', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByText } = await render(<MentorNotificationsScreen />)
    expect(getByText('No notifications yet.')).toBeTruthy()
  })

  it('marks an unread notification read and navigates to Announcements for an announcement type', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeNotification()]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<MentorNotificationsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Unread: New announcement' }))

    expect(markReadMutate).toHaveBeenCalledWith('n1')
    expect(mockPush).toHaveBeenCalledWith('/mentor/announcements')
  })

  it('does not navigate for an unresolvable notification type', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeNotification({ type: 'sadhana_reminder' })]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<MentorNotificationsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Unread: New announcement' }))

    expect(markReadMutate).toHaveBeenCalledWith('n1')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('enables "Mark all read" when there are unread notifications, and calls the mutation on press', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeNotification()]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<MentorNotificationsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Mark all read' }))
    expect(markAllReadMutate).toHaveBeenCalledTimes(1)
  })
})
