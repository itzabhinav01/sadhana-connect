jest.mock('../../../../../packages/notifications/src/use-notifications', () => ({
  useNotifications: jest.fn(),
}))

jest.mock('../../../../../packages/notifications/src/use-mark-notification-read', () => ({
  useMarkNotificationRead: jest.fn(),
}))

jest.mock('../../../../../packages/notifications/src/use-mark-all-notifications-read', () => ({
  useMarkAllNotificationsRead: jest.fn(),
}))

jest.mock('../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../../packages/infra-supabase/src/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: { getReportDateById: jest.fn() },
}))

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

const mockFetchQuery = jest.fn()

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => ({ fetchQuery: mockFetchQuery })),
}))

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@sadhana-connect/notifications'

import NotificationsScreen from './notifications'

const mockUseNotifications = useNotifications as jest.Mock
const mockUseMarkNotificationRead = useMarkNotificationRead as jest.Mock
const mockUseMarkAllNotificationsRead = useMarkAllNotificationsRead as jest.Mock
const mockUseAuth = useAuth as jest.Mock
const mockGetReportDateById = supabaseSadhanaReportRepository.getReportDateById as jest.Mock

function page(notifications: unknown[], nextCursor: unknown = null) {
  return { pages: [{ notifications, nextCursor }] }
}

function makeNotification(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'n1',
    recipientId: 'user-1',
    type: 'mentor_comment',
    title: 'New mentor comment',
    body: 'Great job today!',
    relatedAnnouncementId: null,
    relatedReportId: 'report-1',
    isRead: false,
    readAt: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

describe('NotificationsScreen', () => {
  const markReadMutate = jest.fn()
  const markAllReadMutate = jest.fn()

  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockPush.mockReset()
    mockFetchQuery.mockReset()
    markReadMutate.mockReset()
    markAllReadMutate.mockReset()
    mockGetReportDateById.mockReset()
    mockUseAuth.mockReturnValue({ session: { userId: 'user-1' } })
    mockUseMarkNotificationRead.mockReturnValue({ mutate: markReadMutate })
    mockUseMarkAllNotificationsRead.mockReturnValue({
      mutate: markAllReadMutate,
      isPending: false,
    })
  })

  it('shows a loading state', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByText } = await render(<NotificationsScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error state', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByText } = await render(<NotificationsScreen />)
    expect(
      getByText('Something went wrong loading your notifications. Please try again.'),
    ).toBeTruthy()
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

    const { getByText } = await render(<NotificationsScreen />)
    expect(getByText('No notifications yet.')).toBeTruthy()
  })

  it('renders each notification with its title, body, and timestamp', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([
        makeNotification({ title: 'First' }),
        makeNotification({ id: 'n2', title: 'Second', body: 'Keep it up!' }),
      ]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByText } = await render(<NotificationsScreen />)
    expect(getByText('First')).toBeTruthy()
    expect(getByText('Second')).toBeTruthy()
    expect(getByText('Great job today!')).toBeTruthy()
  })

  it('disables "Mark all read" when there are no unread notifications', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeNotification({ isRead: true })]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<NotificationsScreen />)
    expect(getByRole('button', { name: 'Mark all read' })).toBeDisabled()
  })

  it('enables "Mark all read" when there are unread notifications, and calls the mutation on press', async () => {
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeNotification({ isRead: false })]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<NotificationsScreen />)
    const button = getByRole('button', { name: 'Mark all read' })
    expect(button).toBeEnabled()

    await fireEvent.press(button)
    expect(markAllReadMutate).toHaveBeenCalledTimes(1)
  })

  it('shows a Load more button when there is a next page, and calls fetchNextPage', async () => {
    const fetchNextPage = jest.fn()
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeNotification()]),
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    })

    const { getByRole } = await render(<NotificationsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Load more' }))
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('marks an unread notification read and navigates to the report date for a mentor_comment', async () => {
    const notification = makeNotification({ isRead: false })
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([notification]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })
    mockFetchQuery.mockImplementation(({ queryFn }: { queryFn: () => unknown }) => queryFn())
    mockGetReportDateById.mockResolvedValue('2026-01-14')

    const { getByRole } = await render(<NotificationsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Unread: New mentor comment' }))

    expect(markReadMutate).toHaveBeenCalledWith('n1')
    expect(mockGetReportDateById).toHaveBeenCalledWith('report-1')
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/devotee/sadhana',
        params: { date: '2026-01-14' },
      }),
    )
  })

  it('does not call markRead for an already-read notification, but still navigates', async () => {
    const notification = makeNotification({ isRead: true, type: 'sadhana_reminder', relatedReportId: null })
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([notification]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<NotificationsScreen />)
    await fireEvent.press(getByRole('button', { name: 'New mentor comment' }))

    expect(markReadMutate).not.toHaveBeenCalled()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/devotee/sadhana'))
  })

  it('does not navigate anywhere for an announcement notification (no mobile announcement screen yet)', async () => {
    const notification = makeNotification({
      type: 'announcement',
      relatedReportId: null,
      relatedAnnouncementId: 'ann-1',
      isRead: false,
    })
    mockUseNotifications.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([notification]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<NotificationsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Unread: New mentor comment' }))

    expect(markReadMutate).toHaveBeenCalledWith('n1')
    expect(mockPush).not.toHaveBeenCalled()
  })
})
