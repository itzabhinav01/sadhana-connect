import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationsPage } from '@/presentation/pages/notifications/NotificationsPage'

const {
  useUnreadNotificationCountMock,
  markAllReadMutateMock,
  useNotificationsMock,
} = vi.hoisted(() => ({
  useUnreadNotificationCountMock: vi.fn(),
  markAllReadMutateMock: vi.fn(),
  useNotificationsMock: vi.fn(),
}))

vi.mock('@/application/notifications/use-unread-notification-count', () => ({
  useUnreadNotificationCount: useUnreadNotificationCountMock,
}))
vi.mock('@/application/notifications/use-mark-all-notifications-read', () => ({
  useMarkAllNotificationsRead: () => ({
    mutate: markAllReadMutateMock,
    isPending: false,
  }),
}))
vi.mock('@/application/notifications/use-notifications', () => ({
  useNotifications: useNotificationsMock,
}))

describe('NotificationsPage', () => {
  beforeEach(() => {
    useUnreadNotificationCountMock.mockReset()
    markAllReadMutateMock.mockReset()
    useNotificationsMock.mockReset()
    useNotificationsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ notifications: [], nextCursor: null }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })
  })

  it('renders the page heading', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 0 })

    render(<NotificationsPage />)

    expect(
      screen.getByRole('heading', { name: 'Notifications' }),
    ).toBeInTheDocument()
  })

  it('disables "Mark all read" when there are no unread notifications', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 0 })

    render(<NotificationsPage />)

    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled()
  })

  it('enables "Mark all read" when there are unread notifications, and calls the mutation on click', async () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 4 })
    const user = userEvent.setup()

    render(<NotificationsPage />)
    const button = screen.getByRole('button', { name: 'Mark all read' })
    expect(button).toBeEnabled()

    await user.click(button)

    expect(markAllReadMutateMock).toHaveBeenCalled()
  })

  it('renders the notification list', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 0 })

    render(<NotificationsPage />)

    expect(screen.getByText('No notifications yet.')).toBeInTheDocument()
  })
})
