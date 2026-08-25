import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useDeleteAnnouncement } from '@/application/announcements/use-delete-announcement'

const { useAuthMock, deleteAnnouncementMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  deleteAnnouncementMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase/announcement-repository', () => ({
  supabaseAnnouncementRepository: { deleteAnnouncement: deleteAnnouncementMock },
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

describe('useDeleteAnnouncement', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    deleteAnnouncementMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('deletes the given announcement id and invalidates the list', async () => {
    deleteAnnouncementMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteAnnouncement(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('a1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deleteAnnouncementMock).toHaveBeenCalledWith('a1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: announcementQueryKeys.list('mentor-1'),
    })
  })
})
