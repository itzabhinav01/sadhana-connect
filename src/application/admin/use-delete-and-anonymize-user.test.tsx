import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useDeleteAndAnonymizeUser } from '@/application/admin/use-delete-and-anonymize-user'

const { useAuthMock, anonymizeUserMock, banUserMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  anonymizeUserMock: vi.fn(),
  banUserMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({ useAuth: useAuthMock }))
vi.mock('@/infrastructure/supabase/admin-user-repository', () => ({
  supabaseAdminUserRepository: { anonymizeUser: anonymizeUserMock },
}))
vi.mock('@/infrastructure/supabase/admin-account-actions-repository', () => ({
  supabaseAdminAccountActionsRepository: { banUser: banUserMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDeleteAndAnonymizeUser', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    anonymizeUserMock.mockReset()
    banUserMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('resolves complete when both the DB anonymization and the Auth ban succeed', async () => {
    anonymizeUserMock.mockResolvedValue(undefined)
    banUserMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useDeleteAndAnonymizeUser(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('user-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(anonymizeUserMock).toHaveBeenCalledWith('user-1')
    expect(banUserMock).toHaveBeenCalledWith('user-1')
    expect(result.current.data).toEqual({ stage: 'complete' })
  })

  it('resolves profile-anonymized, not an error, when the DB step succeeds but the ban fails — never a false full-success report', async () => {
    anonymizeUserMock.mockResolvedValue(undefined)
    banUserMock.mockRejectedValue(new Error('network error'))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useDeleteAndAnonymizeUser(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('user-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ stage: 'profile-anonymized' })
  })

  it('never calls the ban step if DB anonymization itself fails', async () => {
    anonymizeUserMock.mockRejectedValue(new Error('constraint violation'))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useDeleteAndAnonymizeUser(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('user-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(banUserMock).not.toHaveBeenCalled()
  })

  it('invalidates every domain anonymization actually affects (Phase 20 — traced, not adminQueryKeys.all)', async () => {
    anonymizeUserMock.mockResolvedValue(undefined)
    banUserMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteAndAnonymizeUser(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('user-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.userDetail('admin-1', 'user-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'users', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'assignments', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.mentorDevoteeCounts('admin-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'mentor-devotee-count', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.dashboardSummary('admin-1'),
    })
    // Exactly these six calls — never the blanket adminQueryKeys.all,
    // and never temple-groups, which anonymization never affects.
    expect(invalidateSpy).toHaveBeenCalledTimes(6)
  })
})
