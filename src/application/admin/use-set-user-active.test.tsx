import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useSetUserActive } from '@/application/admin/use-set-user-active'

const { useAuthMock, setUserActiveMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  setUserActiveMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({ useAuth: useAuthMock }))
vi.mock('@sadhana-connect/infra-supabase/admin-user-repository', () => ({
  supabaseAdminUserRepository: { setUserActive: setUserActiveMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSetUserActive', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    setUserActiveMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('invalidates only the target detail, the users list, and the dashboard summary (Phase 20 — traced, not adminQueryKeys.all)', async () => {
    setUserActiveMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useSetUserActive(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ userId: 'user-1', isActive: false })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(setUserActiveMock).toHaveBeenCalledWith('user-1', false)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.userDetail('admin-1', 'user-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'users', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.dashboardSummary('admin-1'),
    })
    // Exactly these three calls — never the blanket adminQueryKeys.all,
    // and never assignments/mentor-devotee-counts/temple-groups, which
    // is_active never affects.
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
  })
})
