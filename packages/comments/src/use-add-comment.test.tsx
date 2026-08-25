import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAddComment } from './use-add-comment'
import { commentQueryKeys } from './comment-query-keys'

const { useAuthMock, useProfileMock, createCommentMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useProfileMock: vi.fn(),
  createCommentMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
  useProfile: useProfileMock,
}))
vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseSadhanaReportCommentRepository: { createComment: createCommentMock },
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

describe('useAddComment', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useProfileMock.mockReset()
    createCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'mentor-1', fullName: 'Mentor One', role: 'mentor', templeGroupId: null, isActive: true },
    })
  })

  it("posts using the mentor's own current profile name as the snapshot", async () => {
    createCommentMock.mockResolvedValue({
      id: 'c1',
      sadhanaReportId: 'report-1',
      mentorId: 'mentor-1',
      mentorName: 'Mentor One',
      commentText: 'Keep it up!',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useAddComment('report-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('Keep it up!')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createCommentMock).toHaveBeenCalledWith({
      sadhanaReportId: 'report-1',
      mentorId: 'mentor-1',
      mentorName: 'Mentor One',
      commentText: 'Keep it up!',
    })
  })

  it('invalidates the comment list for this report on success', async () => {
    createCommentMock.mockResolvedValue({
      id: 'c1',
      sadhanaReportId: 'report-1',
      mentorId: 'mentor-1',
      mentorName: 'Mentor One',
      commentText: 'Keep it up!',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddComment('report-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('Keep it up!')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: commentQueryKeys.list('mentor-1', 'report-1'),
    })
  })

  it('rejects if the mentor profile has not loaded yet', async () => {
    useProfileMock.mockReturnValue({ data: undefined })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useAddComment('report-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('Keep it up!')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(createCommentMock).not.toHaveBeenCalled()
  })
})
