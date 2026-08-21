import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { useMarkNotificationRead } from '@/application/notifications/use-mark-notification-read'

const { useAuthMock, markReadMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  markReadMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/infrastructure/supabase/notification-repository', () => ({
  supabaseNotificationRepository: { markRead: markReadMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useMarkNotificationRead', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    markReadMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('calls markRead with the given notification id', async () => {
    markReadMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('notification-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(markReadMock).toHaveBeenCalledWith('notification-1')
  })

  it('invalidates the list and unread-count caches for the current user on success', async () => {
    markReadMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('notification-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.list('user-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.unreadCount('user-1'),
    })
  })
})
