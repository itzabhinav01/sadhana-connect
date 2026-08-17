import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useSignOut } from '@/application/auth/use-sign-out'
import { profileQueryKeys } from '@/application/profile/profile-query-keys'

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }))

vi.mock('@/infrastructure/supabase/auth-repository', () => ({
  supabaseAuthRepository: { signOut: signOutMock },
}))

describe('useSignOut', () => {
  it('removes any cached profile queries on successful sign-out', async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    queryClient.setQueryData(profileQueryKeys.detail('user-1'), {
      id: 'user-1',
      fullName: 'Test',
      role: 'devotee',
      templeGroupId: null,
      isActive: true,
    })

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(
      queryClient.getQueryData(profileQueryKeys.detail('user-1')),
    ).toBeUndefined()
  })
})
