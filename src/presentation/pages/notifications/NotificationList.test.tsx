import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationList } from '@/presentation/pages/notifications/NotificationList'

const { useNotificationsMock, markReadMutateMock, navigateToNotificationMock } =
  vi.hoisted(() => ({
    useNotificationsMock: vi.fn(),
    markReadMutateMock: vi.fn(),
    navigateToNotificationMock: vi.fn(),
  }))

vi.mock('@sadhana-connect/notifications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sadhana-connect/notifications')>()),
  useNotifications: useNotificationsMock,
  useMarkNotificationRead: () => ({ mutate: markReadMutateMock }),
}))
vi.mock('@/application/notifications/use-notification-navigation', () => ({
  useNotificationNavigation: () => navigateToNotificationMock,
}))

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

describe('NotificationList', () => {
  beforeEach(() => {
    useNotificationsMock.mockReset()
    markReadMutateMock.mockReset()
    navigateToNotificationMock.mockReset()
    navigateToNotificationMock.mockResolvedValue(undefined)
  })

  it('shows a loading state', () => {
    useNotificationsMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<NotificationList />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useNotificationsMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<NotificationList />)

    expect(
      screen.getByText(/something went wrong loading your notifications/i),
    ).toBeInTheDocument()
  })

  it('shows the exact empty-state copy when there are no notifications', () => {
    useNotificationsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ notifications: [], nextCursor: null }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<NotificationList />)

    expect(screen.getByText('No notifications yet.')).toBeInTheDocument()
  })

  it('renders notifications from all fetched pages, newest first as returned by the query', () => {
    useNotificationsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        pages: [
          {
            notifications: [
              makeNotification({ id: 'n1', title: 'First' }),
              makeNotification({ id: 'n2', title: 'Second' }),
            ],
          },
          { notifications: [makeNotification({ id: 'n3', title: 'Third' })] },
        ],
      },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<NotificationList />)

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('shows a Load More button when there is a next page, and calls fetchNextPage', async () => {
    const fetchNextPage = vi.fn()
    useNotificationsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ notifications: [makeNotification()] }] },
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    })
    const user = userEvent.setup()

    render(<NotificationList />)
    await user.click(screen.getByRole('button', { name: /load more/i }))

    expect(fetchNextPage).toHaveBeenCalled()
  })

  it('hides the Load More button when there is no next page', () => {
    useNotificationsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [{ notifications: [makeNotification()] }] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<NotificationList />)

    expect(
      screen.queryByRole('button', { name: /load more/i }),
    ).not.toBeInTheDocument()
  })
})
