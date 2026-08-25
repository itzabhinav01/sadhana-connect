import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { announcementCommentQueryKeys } from '@/application/announcements/announcement-comment-query-keys'
import { useCreateAnnouncementComment } from '@/application/announcements/use-create-announcement-comment'

const { useAuthMock, useProfileMock, createCommentMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useProfileMock: vi.fn(),
  createCommentMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
  useProfile: useProfileMock,
}))
vi.mock('@sadhana-connect/infra-supabase/announcement-comment-repository', () => ({
  supabaseAnnouncementCommentRepository: { createComment: createCommentMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCreateAnnouncementComment', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useProfileMock.mockReset()
    createCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'devotee-1', email: 'd@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'devotee-1', fullName: 'Devotee One', role: 'devotee', templeGroupId: null, isActive: true },
    })
  })

  it("posts using the caller's own current profile name as the snapshot", async () => {
    createCommentMock.mockResolvedValue({
      id: 'c1',
      announcementId: 'a1',
      authorId: 'devotee-1',
      authorName: 'Devotee One',
      commentText: 'When does this start?',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useCreateAnnouncementComment('a1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('When does this start?')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createCommentMock).toHaveBeenCalledWith({
      announcementId: 'a1',
      authorId: 'devotee-1',
      authorName: 'Devotee One',
      commentText: 'When does this start?',
    })
  })

  it('invalidates the comment list for this announcement on success', async () => {
    createCommentMock.mockResolvedValue({
      id: 'c1',
      announcementId: 'a1',
      authorId: 'devotee-1',
      authorName: 'Devotee One',
      commentText: 'When does this start?',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateAnnouncementComment('a1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('When does this start?')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: announcementCommentQueryKeys.list('devotee-1', 'a1'),
    })
  })

  it('rejects if the profile has not loaded yet', async () => {
    useProfileMock.mockReturnValue({ data: undefined })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useCreateAnnouncementComment('a1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('When does this start?')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(createCommentMock).not.toHaveBeenCalled()
  })
})
