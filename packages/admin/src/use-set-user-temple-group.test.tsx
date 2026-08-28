import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from './admin-query-keys'
import { useSetUserTempleGroup } from './use-set-user-temple-group'

const { useAuthMock, setUserTempleGroupMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  setUserTempleGroupMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({ useAuth: useAuthMock }))
vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseAdminUserRepository: { setUserTempleGroup: setUserTempleGroupMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSetUserTempleGroup', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    setUserTempleGroupMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('assigns a temple group and invalidates the target detail and users list', async () => {
    setUserTempleGroupMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useSetUserTempleGroup(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ userId: 'user-1', templeGroupId: 'group-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(setUserTempleGroupMock).toHaveBeenCalledWith('user-1', 'group-1')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.userDetail('admin-1', 'user-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'users', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(2)
  })

  it('clears a temple group assignment by passing null', async () => {
    setUserTempleGroupMock.mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useSetUserTempleGroup(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ userId: 'user-1', templeGroupId: null })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(setUserTempleGroupMock).toHaveBeenCalledWith('user-1', null)
  })
})
