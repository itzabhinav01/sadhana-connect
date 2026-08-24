import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SadhanaNotification } from '@sadhana-connect/domain/entities/notification'
import { NotificationItem } from '@/presentation/pages/notifications/NotificationItem'

const { markReadMutateMock, navigateToNotificationMock } = vi.hoisted(() => ({
  markReadMutateMock: vi.fn(),
  navigateToNotificationMock: vi.fn(),
}))

vi.mock('@/application/notifications/use-mark-notification-read', () => ({
  useMarkNotificationRead: () => ({ mutate: markReadMutateMock }),
}))

vi.mock('@/application/notifications/use-notification-navigation', () => ({
  useNotificationNavigation: () => navigateToNotificationMock,
}))

function baseNotification(
  overrides: Partial<SadhanaNotification> = {},
): SadhanaNotification {
  return {
    id: 'n1',
    recipientId: 'user-1',
    type: 'mentor_comment',
    title: 'New mentor comment',
    body: 'Keep up the good chanting!',
    relatedAnnouncementId: null,
    relatedReportId: 'report-1',
    isRead: false,
    readAt: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

describe('NotificationItem', () => {
  beforeEach(() => {
    markReadMutateMock.mockReset()
    navigateToNotificationMock.mockReset()
    navigateToNotificationMock.mockResolvedValue(undefined)
  })

  it('shows the title and body preview', () => {
    render(<NotificationItem notification={baseNotification()} />)

    expect(screen.getByText('New mentor comment')).toBeInTheDocument()
    expect(screen.getByText('Keep up the good chanting!')).toBeInTheDocument()
  })

  it('shows an unread visual indicator and accessible label when unread', () => {
    render(<NotificationItem notification={baseNotification({ isRead: false })} />)

    expect(
      screen.getByRole('button', { name: /^Unread: New mentor comment$/ }),
    ).toBeInTheDocument()
  })

  it('does not show the unread indicator once read', () => {
    render(<NotificationItem notification={baseNotification({ isRead: true })} />)

    expect(
      screen.getByRole('button', { name: 'New mentor comment' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^Unread:/)).not.toBeInTheDocument()
  })

  it('marks an unread notification read when clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationItem notification={baseNotification({ isRead: false })} />)

    await user.click(screen.getByRole('button'))

    expect(markReadMutateMock).toHaveBeenCalledWith('n1')
  })

  it('does not re-mark an already-read notification as read', async () => {
    const user = userEvent.setup()
    render(<NotificationItem notification={baseNotification({ isRead: true })} />)

    await user.click(screen.getByRole('button'))

    expect(markReadMutateMock).not.toHaveBeenCalled()
  })

  it('navigates using the shared notification-navigation resolver on click', async () => {
    const user = userEvent.setup()
    const notification = baseNotification()
    render(<NotificationItem notification={notification} />)

    await user.click(screen.getByRole('button'))

    expect(navigateToNotificationMock).toHaveBeenCalledWith(notification)
  })
})
