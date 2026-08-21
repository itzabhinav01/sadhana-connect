import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationBell } from '@/presentation/layouts/NotificationBell'

const { useUnreadNotificationCountMock } = vi.hoisted(() => ({
  useUnreadNotificationCountMock: vi.fn(),
}))

vi.mock('@/application/notifications/use-unread-notification-count', () => ({
  useUnreadNotificationCount: useUnreadNotificationCountMock,
}))

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  )
}

describe('NotificationBell', () => {
  beforeEach(() => {
    useUnreadNotificationCountMock.mockReset()
  })

  it('links to /notifications', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 0 })

    renderBell()

    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute(
      'href',
      '/notifications',
    )
  })

  it('shows no badge when there are no unread notifications', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 0 })

    renderBell()

    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('shows the exact unread count in the badge and accessible name', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 5 })

    renderBell()

    expect(
      screen.getByRole('link', { name: 'Notifications, 5 unread' }),
    ).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('caps the displayed badge at 99+', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 150 })

    renderBell()

    expect(screen.getByText('99+')).toBeInTheDocument()
  })
})
