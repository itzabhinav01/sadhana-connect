import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { useDeleteComment } from '@/application/comments/use-delete-comment'

const { useAuthMock, deleteCommentMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  deleteCommentMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase/sadhana-report-comment-repository', () => ({
  supabaseSadhanaReportCommentRepository: { deleteComment: deleteCommentMock },
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

describe('useDeleteComment', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    deleteCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('deletes the given comment id and invalidates the list', async () => {
    deleteCommentMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteComment('report-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('c1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deleteCommentMock).toHaveBeenCalledWith('c1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: commentQueryKeys.list('mentor-1', 'report-1'),
    })
  })
})
