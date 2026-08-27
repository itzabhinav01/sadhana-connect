import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { notificationQueryKeys } from './notification-query-keys'
import { useMarkAllNotificationsRead } from './use-mark-all-notifications-read'

const { useAuthMock, markAllReadMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  markAllReadMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseNotificationRepository: { markAllRead: markAllReadMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useMarkAllNotificationsRead', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    markAllReadMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it("marks all of the current user's notifications read", async () => {
    markAllReadMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(markAllReadMock).toHaveBeenCalledWith('user-1')
  })

  it('invalidates the list and unread-count caches on success', async () => {
    markAllReadMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.list('user-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.unreadCount('user-1'),
    })
  })
})
