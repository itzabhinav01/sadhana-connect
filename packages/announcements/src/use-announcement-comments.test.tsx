import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnnouncementComments } from './use-announcement-comments'

const { useAuthMock, listCommentsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listCommentsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseAnnouncementCommentRepository: { listComments: listCommentsMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAnnouncementComments', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listCommentsMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('does not fetch when enabled is false', () => {
    const { result } = renderHook(() => useAnnouncementComments('a1', false), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listCommentsMock).not.toHaveBeenCalled()
  })

  it('does not fetch when there is no authenticated user, even if enabled', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useAnnouncementComments('a1', true), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listCommentsMock).not.toHaveBeenCalled()
  })

  it('fetches the given announcement id when enabled', async () => {
    listCommentsMock.mockResolvedValue([])

    const { result } = renderHook(() => useAnnouncementComments('a1', true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listCommentsMock).toHaveBeenCalledWith('a1')
  })
})
