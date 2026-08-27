import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from '@sadhana-connect/admin'
import { useHardDeleteUser } from '@/application/admin/use-hard-delete-user'

const { useAuthMock, hardDeleteUserMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  hardDeleteUserMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase/admin-account-actions-repository', () => ({
  supabaseAdminAccountActionsRepository: { hardDeleteUser: hardDeleteUserMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useHardDeleteUser', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    hardDeleteUserMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('calls the repository with the target user id and resolves complete on full success', async () => {
    hardDeleteUserMock.mockResolvedValue({ stage: 'complete' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useHardDeleteUser(), { wrapper: createWrapper(queryClient) })

    result.current.mutate('user-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(hardDeleteUserMock).toHaveBeenCalledWith('user-1')
    expect(result.current.data).toEqual({ stage: 'complete' })
  })

  it('resolves with the profile-deleted stage rather than throwing, on the rare auth-cleanup partial failure', async () => {
    hardDeleteUserMock.mockResolvedValue({ stage: 'profile-deleted' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useHardDeleteUser(), { wrapper: createWrapper(queryClient) })

    result.current.mutate('user-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ stage: 'profile-deleted' })
  })

  it('invalidates every affected admin domain on success', async () => {
    hardDeleteUserMock.mockResolvedValue({ stage: 'complete' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useHardDeleteUser(), { wrapper: createWrapper(queryClient) })

    result.current.mutate('user-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.userDetail('admin-1', 'user-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'users', 'admin-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'assignments', 'admin-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.mentorDevoteeCounts('admin-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'mentor-devotee-count', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.dashboardSummary('admin-1'),
    })
  })
})
