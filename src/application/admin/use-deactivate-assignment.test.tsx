import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useDeactivateAssignment } from '@/application/admin/use-deactivate-assignment'

const { useAuthMock, deactivateAssignmentMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  deactivateAssignmentMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({ useAuth: useAuthMock }))
vi.mock('@/infrastructure/supabase/admin-assignment-repository', () => ({
  supabaseAdminAssignmentRepository: { deactivateAssignment: deactivateAssignmentMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDeactivateAssignment', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    deactivateAssignmentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('deactivates the given assignment', async () => {
    deactivateAssignmentMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useDeactivateAssignment(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('assignment-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deactivateAssignmentMock).toHaveBeenCalledWith('assignment-1')
  })

  it('invalidates only the domains a deactivation actually affects (Phase 20 — traced, not adminQueryKeys.all)', async () => {
    deactivateAssignmentMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeactivateAssignment(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('assignment-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
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
    // Exactly these four calls — never the blanket adminQueryKeys.all,
    // and never users/userDetail/temple-groups, which deactivating an
    // assignment row never affects (no profile field changes).
    expect(invalidateSpy).toHaveBeenCalledTimes(4)
  })
})
