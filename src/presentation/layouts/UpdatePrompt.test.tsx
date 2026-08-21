import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UpdatePrompt } from '@/presentation/layouts/UpdatePrompt'

const { useServiceWorkerUpdateMock } = vi.hoisted(() => ({
  useServiceWorkerUpdateMock: vi.fn(),
}))

vi.mock('@/application/pwa/use-service-worker-update', () => ({
  useServiceWorkerUpdate: useServiceWorkerUpdateMock,
}))

describe('UpdatePrompt', () => {
  const refreshMock = vi.fn()
  const dismissMock = vi.fn()

  beforeEach(() => {
    refreshMock.mockReset()
    dismissMock.mockReset()
  })

  it('renders nothing when no update is waiting', () => {
    useServiceWorkerUpdateMock.mockReturnValue({
      needRefresh: false,
      refresh: refreshMock,
      dismiss: dismissMock,
    })

    render(<UpdatePrompt />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the update message and actions when an update is waiting', () => {
    useServiceWorkerUpdateMock.mockReturnValue({
      needRefresh: true,
      refresh: refreshMock,
      dismiss: dismissMock,
    })

    render(<UpdatePrompt />)

    expect(screen.getByText(/a new version is available/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Dismiss update notice' }),
    ).toBeInTheDocument()
  })

  it('calls refresh() when Refresh is clicked, and never reloads on its own', async () => {
    const user = userEvent.setup()
    useServiceWorkerUpdateMock.mockReturnValue({
      needRefresh: true,
      refresh: refreshMock,
      dismiss: dismissMock,
    })

    render(<UpdatePrompt />)
    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(refreshMock).toHaveBeenCalledTimes(1)
    expect(dismissMock).not.toHaveBeenCalled()
  })

  it('calls dismiss() when Dismiss is clicked', async () => {
    const user = userEvent.setup()
    useServiceWorkerUpdateMock.mockReturnValue({
      needRefresh: true,
      refresh: refreshMock,
      dismiss: dismissMock,
    })

    render(<UpdatePrompt />)
    await user.click(screen.getByRole('button', { name: 'Dismiss update notice' }))

    expect(dismissMock).toHaveBeenCalledTimes(1)
    expect(refreshMock).not.toHaveBeenCalled()
  })
})
