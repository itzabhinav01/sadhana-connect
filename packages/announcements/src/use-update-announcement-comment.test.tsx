import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { announcementCommentQueryKeys } from './announcement-comment-query-keys'
import { useUpdateAnnouncementComment } from './use-update-announcement-comment'

const { useAuthMock, updateCommentMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  updateCommentMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseAnnouncementCommentRepository: { updateComment: updateCommentMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUpdateAnnouncementComment', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    updateCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'devotee-1', email: 'd@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('updates the given comment and invalidates its list', async () => {
    updateCommentMock.mockResolvedValue({
      id: 'c1',
      announcementId: 'a1',
      authorId: 'devotee-1',
      authorName: 'Devotee One',
      commentText: 'Edited question',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-16T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateAnnouncementComment('a1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ commentId: 'c1', commentText: 'Edited question' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateCommentMock).toHaveBeenCalledWith('c1', 'Edited question')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: announcementCommentQueryKeys.list('devotee-1', 'a1'),
    })
  })
})
