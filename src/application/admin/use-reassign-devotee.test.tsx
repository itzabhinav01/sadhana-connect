import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useReassignDevotee } from '@/application/admin/use-reassign-devotee'

const { useAuthMock, reassignDevoteeMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  reassignDevoteeMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({ useAuth: useAuthMock }))
vi.mock('@/infrastructure/supabase/admin-assignment-repository', () => ({
  supabaseAdminAssignmentRepository: { reassignDevotee: reassignDevoteeMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const assignmentResult = {
  id: 'assignment-2',
  mentorId: 'mentor-2',
  mentorName: 'New Mentor',
  devoteeId: 'devotee-1',
  devoteeName: 'Test Devotee',
  isActive: true,
  assignedAt: '2026-01-15T00:00:00.000Z',
  unassignedAt: null,
}

describe('useReassignDevotee', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    reassignDevoteeMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('reassigns the devotee to the given mentor', async () => {
    reassignDevoteeMock.mockResolvedValue(assignmentResult)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useReassignDevotee(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ devoteeId: 'devotee-1', mentorId: 'mentor-2' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(reassignDevoteeMock).toHaveBeenCalledWith('devotee-1', 'mentor-2')
  })

  it('invalidates only the domains a reassignment actually affects (Phase 20 — traced, not adminQueryKeys.all)', async () => {
    reassignDevoteeMock.mockResolvedValue(assignmentResult)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useReassignDevotee(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ devoteeId: 'devotee-1', mentorId: 'mentor-2' })

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
    // and never users/userDetail/temple-groups, which reassignment never
    // affects (no profile field changes).
    expect(invalidateSpy).toHaveBeenCalledTimes(4)
  })
})
