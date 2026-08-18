import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnnouncements } from '@/application/announcements/use-announcements'

const { useAuthMock, listVisibleAnnouncementsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listVisibleAnnouncementsMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/infrastructure/supabase/announcement-repository', () => ({
  supabaseAnnouncementRepository: {
    listVisibleAnnouncements: listVisibleAnnouncementsMock,
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useAnnouncements', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listVisibleAnnouncementsMock.mockReset()
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useAnnouncements(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listVisibleAnnouncementsMock).not.toHaveBeenCalled()
  })

  it('fetches the RLS-scoped list with no role/scope parameters', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listVisibleAnnouncementsMock.mockResolvedValue([])

    const { result } = renderHook(() => useAnnouncements(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listVisibleAnnouncementsMock).toHaveBeenCalledWith()
  })
})
