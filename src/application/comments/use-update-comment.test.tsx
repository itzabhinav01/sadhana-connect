import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { useUpdateComment } from '@/application/comments/use-update-comment'

const { useAuthMock, updateCommentMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  updateCommentMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/infrastructure/supabase/sadhana-report-comment-repository', () => ({
  supabaseSadhanaReportCommentRepository: { updateComment: updateCommentMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useUpdateComment', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    updateCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('updates the given comment id with new text and invalidates the list', async () => {
    updateCommentMock.mockResolvedValue({
      id: 'c1',
      sadhanaReportId: 'report-1',
      mentorId: 'mentor-1',
      mentorName: 'Mentor One',
      commentText: 'Edited',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-16T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateComment('report-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ commentId: 'c1', commentText: 'Edited' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateCommentMock).toHaveBeenCalledWith('c1', 'Edited')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: commentQueryKeys.list('mentor-1', 'report-1'),
    })
  })
})
