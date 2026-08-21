import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { useNotificationsRealtime } from '@/application/notifications/use-notifications-realtime'

const {
  useAuthMock,
  useProfileMock,
  onMock,
  subscribeMock,
  removeChannelMock,
  channelFactoryMock,
} = vi.hoisted(() => {
  const subscribeMock = vi.fn()
  const onMock = vi.fn()
  const channelObj = { on: onMock, subscribe: subscribeMock }
  onMock.mockReturnValue(channelObj)
  subscribeMock.mockReturnValue(channelObj)
  return {
    useAuthMock: vi.fn(),
    useProfileMock: vi.fn(),
    onMock,
    subscribeMock,
    removeChannelMock: vi.fn(),
    channelFactoryMock: vi.fn(() => channelObj),
  }
})

vi.mock('@/application/auth/use-auth', () => ({ useAuth: useAuthMock }))
vi.mock('@/application/profile/use-profile', () => ({ useProfile: useProfileMock }))
vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    channel: channelFactoryMock,
    removeChannel: removeChannelMock,
  },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useNotificationsRealtime', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useProfileMock.mockReset()
    onMock.mockClear()
    subscribeMock.mockClear()
    removeChannelMock.mockClear()
    channelFactoryMock.mockClear()
  })

  it('does not open a channel when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })
    useProfileMock.mockReturnValue({ data: undefined })

    renderHook(() => useNotificationsRealtime(), {
      wrapper: createWrapper(new QueryClient()),
    })

    expect(channelFactoryMock).not.toHaveBeenCalled()
  })

  it('does not open a channel for a non-devotee role — notifications are devotee-only (Phase 17)', () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'mentor-1', fullName: 'Mentor One', role: 'mentor', templeGroupId: null, isActive: true },
    })

    renderHook(() => useNotificationsRealtime(), {
      wrapper: createWrapper(new QueryClient()),
    })

    expect(channelFactoryMock).not.toHaveBeenCalled()
  })

  it("subscribes to only the current devotee's own notifications", () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'user-1', fullName: 'Devotee One', role: 'devotee', templeGroupId: null, isActive: true },
    })

    renderHook(() => useNotificationsRealtime(), {
      wrapper: createWrapper(new QueryClient()),
    })

    expect(channelFactoryMock).toHaveBeenCalledWith('notifications:user-1')
    expect(onMock).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'recipient_id=eq.user-1',
      }),
      expect.any(Function),
    )
    expect(subscribeMock).toHaveBeenCalledTimes(1)
  })

  it('invalidates the list and unread-count caches when an INSERT event fires', () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'user-1', fullName: 'Devotee One', role: 'devotee', templeGroupId: null, isActive: true },
    })
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useNotificationsRealtime(), { wrapper: createWrapper(queryClient) })

    const insertHandler = onMock.mock.calls[0][2]
    insertHandler()

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.list('user-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: notificationQueryKeys.unreadCount('user-1'),
    })
  })

  it('removes the channel on unmount, never leaking a stale subscription', () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'user-1', fullName: 'Devotee One', role: 'devotee', templeGroupId: null, isActive: true },
    })

    const { unmount } = renderHook(() => useNotificationsRealtime(), {
      wrapper: createWrapper(new QueryClient()),
    })

    unmount()

    expect(removeChannelMock).toHaveBeenCalledTimes(1)
  })

  it('removes the previous channel and opens a new one when the account switches', () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'user-1', fullName: 'Devotee One', role: 'devotee', templeGroupId: null, isActive: true },
    })

    const { rerender } = renderHook(() => useNotificationsRealtime(), {
      wrapper: createWrapper(new QueryClient()),
    })

    expect(channelFactoryMock).toHaveBeenCalledWith('notifications:user-1')

    useAuthMock.mockReturnValue({
      session: { userId: 'user-2', email: 'b@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'user-2', fullName: 'Devotee Two', role: 'devotee', templeGroupId: null, isActive: true },
    })
    rerender()

    expect(removeChannelMock).toHaveBeenCalledTimes(1)
    expect(channelFactoryMock).toHaveBeenCalledWith('notifications:user-2')
  })
})
