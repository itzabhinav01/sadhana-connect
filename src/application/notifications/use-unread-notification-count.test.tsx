import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUnreadNotificationCount } from '@/application/notifications/use-unread-notification-count'

const { useAuthMock, countUnreadMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  countUnreadMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/infrastructure/supabase/notification-repository', () => ({
  supabaseNotificationRepository: { countUnread: countUnreadMock },
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

describe('useUnreadNotificationCount', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    countUnreadMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('returns the count for the current user', async () => {
    countUnreadMock.mockResolvedValue(3)

    const { result } = renderHook(() => useUnreadNotificationCount(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(3)
    expect(countUnreadMock).toHaveBeenCalledWith('user-1')
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    renderHook(() => useUnreadNotificationCount(), { wrapper: createWrapper() })

    expect(countUnreadMock).not.toHaveBeenCalled()
  })
})
