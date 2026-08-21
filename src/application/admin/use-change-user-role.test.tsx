import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import {
  MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE,
  MentorHasActiveDevoteesError,
  useChangeUserRole,
} from '@/application/admin/use-change-user-role'

const { useAuthMock, getMentorDevoteeCountMock, changeUserRoleMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  getMentorDevoteeCountMock: vi.fn(),
  changeUserRoleMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/infrastructure/supabase/admin-assignment-repository', () => ({
  supabaseAdminAssignmentRepository: { getMentorDevoteeCount: getMentorDevoteeCountMock },
}))
vi.mock('@/infrastructure/supabase/admin-user-repository', () => ({
  supabaseAdminUserRepository: { changeUserRole: changeUserRoleMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useChangeUserRole', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    getMentorDevoteeCountMock.mockReset()
    changeUserRoleMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('promotes a devotee to mentor without ever checking the active-assignment count', async () => {
    changeUserRoleMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useChangeUserRole(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ userId: 'devotee-1', currentRole: 'devotee', newRole: 'mentor' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getMentorDevoteeCountMock).not.toHaveBeenCalled()
    expect(changeUserRoleMock).toHaveBeenCalledWith('devotee-1', 'mentor')
  })

  it('re-queries the active-assignment count immediately before demoting a mentor, and blocks when it is non-zero', async () => {
    getMentorDevoteeCountMock.mockResolvedValue(2)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useChangeUserRole(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ userId: 'mentor-1', currentRole: 'mentor', newRole: 'devotee' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getMentorDevoteeCountMock).toHaveBeenCalledWith('mentor-1')
    expect(changeUserRoleMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeInstanceOf(MentorHasActiveDevoteesError)
    expect(result.current.error?.message).toBe(MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE)
  })

  it('demotes a mentor with zero active assignments', async () => {
    getMentorDevoteeCountMock.mockResolvedValue(0)
    changeUserRoleMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useChangeUserRole(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ userId: 'mentor-1', currentRole: 'mentor', newRole: 'devotee' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getMentorDevoteeCountMock).toHaveBeenCalledWith('mentor-1')
    expect(changeUserRoleMock).toHaveBeenCalledWith('mentor-1', 'devotee')
  })

  it('invalidates only the affected admin domains on success (Phase 20 — traced, not adminQueryKeys.all)', async () => {
    getMentorDevoteeCountMock.mockResolvedValue(0)
    changeUserRoleMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useChangeUserRole(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ userId: 'mentor-1', currentRole: 'mentor', newRole: 'devotee' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.userDetail('admin-1', 'mentor-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'users', 'admin-1'],
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
    // Exactly these five calls — never the blanket adminQueryKeys.all,
    // and never assignments/temple-groups, which a role change never
    // affects (mentor_assignments rows themselves are untouched).
    expect(invalidateSpy).toHaveBeenCalledTimes(5)
  })
})
