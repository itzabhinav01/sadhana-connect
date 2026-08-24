import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useUpdateAnnouncement } from '@/application/announcements/use-update-announcement'

const { useAuthMock, updateAnnouncementMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  updateAnnouncementMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase/announcement-repository', () => ({
  supabaseAnnouncementRepository: { updateAnnouncement: updateAnnouncementMock },
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

describe('useUpdateAnnouncement', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    updateAnnouncementMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('updates the given announcement and invalidates the list', async () => {
    updateAnnouncementMock.mockResolvedValue({
      id: 'a1',
      authorId: 'mentor-1',
      title: 'Edited',
      content: 'Body',
      scope: 'temple_group',
      templeGroupId: 'group-1',
      isPublished: true,
      publishedAt: '2026-01-15T00:00:00.000Z',
      expiresAt: null,
      isPinned: false,
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-16T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateAnnouncement(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      id: 'a1',
      title: 'Edited',
      content: 'Body',
      isPublished: true,
      expiresAt: null,
      isPinned: false,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateAnnouncementMock).toHaveBeenCalledWith('a1', {
      title: 'Edited',
      content: 'Body',
      isPublished: true,
      expiresAt: null,
      isPinned: false,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: announcementQueryKeys.list('mentor-1'),
    })
  })

  it('passes isPinned = true through to the repository (pin toggle)', async () => {
    updateAnnouncementMock.mockResolvedValue({
      id: 'a1',
      authorId: 'mentor-1',
      title: 'Edited',
      content: 'Body',
      scope: 'temple_group',
      templeGroupId: 'group-1',
      isPublished: true,
      publishedAt: '2026-01-15T00:00:00.000Z',
      expiresAt: null,
      isPinned: true,
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-16T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useUpdateAnnouncement(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      id: 'a1',
      title: 'Edited',
      content: 'Body',
      isPublished: true,
      expiresAt: null,
      isPinned: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateAnnouncementMock).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ isPinned: true }),
    )
  })
})
