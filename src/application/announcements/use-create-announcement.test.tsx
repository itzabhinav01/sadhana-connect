import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useCreateMentorAnnouncement } from '@/application/announcements/use-create-announcement'

const { useAuthMock, useProfileMock, createAnnouncementMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useProfileMock: vi.fn(),
  createAnnouncementMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/application/profile/use-profile', () => ({
  useProfile: useProfileMock,
}))
vi.mock('@sadhana-connect/infra-supabase/announcement-repository', () => ({
  supabaseAnnouncementRepository: { createAnnouncement: createAnnouncementMock },
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

describe('useCreateMentorAnnouncement', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useProfileMock.mockReset()
    createAnnouncementMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it("always sends scope 'temple_group' and the mentor's own temple_group_id — never a caller-chosen scope", async () => {
    useProfileMock.mockReturnValue({
      data: { id: 'mentor-1', fullName: 'Mentor One', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })
    createAnnouncementMock.mockResolvedValue({
      id: 'a1',
      authorId: 'mentor-1',
      title: 'Notice',
      content: 'Body',
      scope: 'temple_group',
      templeGroupId: 'group-1',
      isPublished: true,
      publishedAt: '2026-01-15T00:00:00.000Z',
      expiresAt: null,
      isPinned: false,
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useCreateMentorAnnouncement(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ title: 'Notice', content: 'Body', isPublished: true, expiresAt: null })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createAnnouncementMock).toHaveBeenCalledWith({
      authorId: 'mentor-1',
      title: 'Notice',
      content: 'Body',
      scope: 'temple_group',
      templeGroupId: 'group-1',
      isPublished: true,
      expiresAt: null,
    })
  })

  it('rejects without calling the repository when the mentor has no temple group', async () => {
    useProfileMock.mockReturnValue({
      data: { id: 'mentor-1', fullName: 'Mentor One', role: 'mentor', templeGroupId: null, isActive: true },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useCreateMentorAnnouncement(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ title: 'Notice', content: 'Body', isPublished: true, expiresAt: null })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(createAnnouncementMock).not.toHaveBeenCalled()
  })

  it('invalidates the announcement list on success', async () => {
    useProfileMock.mockReturnValue({
      data: { id: 'mentor-1', fullName: 'Mentor One', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })
    createAnnouncementMock.mockResolvedValue({
      id: 'a1',
      authorId: 'mentor-1',
      title: 'Notice',
      content: 'Body',
      scope: 'temple_group',
      templeGroupId: 'group-1',
      isPublished: false,
      publishedAt: null,
      expiresAt: null,
      isPinned: false,
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateMentorAnnouncement(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ title: 'Notice', content: 'Body', isPublished: false, expiresAt: null })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: announcementQueryKeys.list('mentor-1'),
    })
  })

  it('passes a non-null expiresAt straight through to the repository', async () => {
    useProfileMock.mockReturnValue({
      data: { id: 'mentor-1', fullName: 'Mentor One', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })
    createAnnouncementMock.mockResolvedValue({
      id: 'a1',
      authorId: 'mentor-1',
      title: 'Notice',
      content: 'Body',
      scope: 'temple_group',
      templeGroupId: 'group-1',
      isPublished: true,
      publishedAt: '2026-01-15T00:00:00.000Z',
      expiresAt: '2026-01-22T00:00:00.000Z',
      isPinned: false,
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useCreateMentorAnnouncement(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      title: 'Notice',
      content: 'Body',
      isPublished: true,
      expiresAt: '2026-01-22T00:00:00.000Z',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createAnnouncementMock).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: '2026-01-22T00:00:00.000Z' }),
    )
  })
})
