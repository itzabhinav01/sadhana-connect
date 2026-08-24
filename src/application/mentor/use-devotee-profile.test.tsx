import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDevoteeProfile } from '@/application/mentor/use-devotee-profile'

const { useAuthMock, getProfileMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  getProfileMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase/profile-repository', () => ({
  supabaseProfileRepository: { getProfile: getProfileMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useDevoteeProfile', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    getProfileMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('fetches the given devoteeId, not the current session user', async () => {
    getProfileMock.mockResolvedValue({
      id: 'devotee-1',
      fullName: 'Devotee One',
      role: 'devotee',
      templeGroupId: null,
      isActive: true,
    })

    const { result } = renderHook(() => useDevoteeProfile('devotee-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getProfileMock).toHaveBeenCalledWith('devotee-1')
    expect(result.current.data?.fullName).toBe('Devotee One')
  })

  it('resolves to null (not an error) when RLS denies the devotee, indistinguishable from nonexistence', async () => {
    getProfileMock.mockResolvedValue(null)

    const { result } = renderHook(() => useDevoteeProfile('unassigned-devotee'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('does not fetch when there is no authenticated mentor', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useDevoteeProfile('devotee-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getProfileMock).not.toHaveBeenCalled()
  })
})
