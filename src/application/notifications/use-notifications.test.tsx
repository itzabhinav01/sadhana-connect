import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotifications } from '@/application/notifications/use-notifications'
import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'

const { useAuthMock, listNotificationsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listNotificationsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase/notification-repository', () => ({
  supabaseNotificationRepository: { listNotifications: listNotificationsMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useNotifications', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listNotificationsMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('fetches the first page scoped to the current user, with no cursor', async () => {
    listNotificationsMock.mockResolvedValue({ notifications: [], nextCursor: null })

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(listNotificationsMock).toHaveBeenCalledWith('user-1', {
      limit: 20,
      cursor: null,
    })
  })

  it('exposes hasNextPage from the repository cursor and fetches the next page on request', async () => {
    listNotificationsMock
      .mockResolvedValueOnce({
        notifications: [{ id: 'n1' }],
        nextCursor: { createdAt: '2026-01-01T00:00:00.000Z', id: 'n1' },
      })
      .mockResolvedValueOnce({ notifications: [{ id: 'n2' }], nextCursor: null })

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(true)

    await result.current.fetchNextPage()

    await waitFor(() =>
      expect(listNotificationsMock).toHaveBeenLastCalledWith('user-1', {
        limit: 20,
        cursor: { createdAt: '2026-01-01T00:00:00.000Z', id: 'n1' },
      }),
    )
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    renderHook(() => useNotifications(), { wrapper: createWrapper() })

    expect(listNotificationsMock).not.toHaveBeenCalled()
  })

  it('uses a query key scoped by userId', () => {
    expect(notificationQueryKeys.list('user-1')).toEqual([
      'notifications',
      'list',
      'user-1',
    ])
    expect(notificationQueryKeys.list('user-2')).not.toEqual(
      notificationQueryKeys.list('user-1'),
    )
  })
})
