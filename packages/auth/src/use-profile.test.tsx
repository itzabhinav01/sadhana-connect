import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProfile } from './use-profile'

const { useAuthMock, getProfileMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  getProfileMock: vi.fn(),
}))

vi.mock('./use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
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

describe('useProfile', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    getProfileMock.mockReset()
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getProfileMock).not.toHaveBeenCalled()
  })

  it('fetches the profile scoped to the authenticated user id', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    getProfileMock.mockResolvedValue({
      id: 'user-1',
      fullName: 'User One',
      role: 'devotee',
      templeGroupId: null,
      isActive: true,
    })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getProfileMock).toHaveBeenCalledWith('user-1')
    expect(result.current.data?.fullName).toBe('User One')
  })

  it('never shows a previous user\'s profile when the session switches to a different user', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    getProfileMock.mockResolvedValue({
      id: 'user-1',
      fullName: 'User One',
      role: 'devotee',
      templeGroupId: null,
      isActive: true,
    })

    const { result, rerender } = renderHook(() => useProfile(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.fullName).toBe('User One')

    useAuthMock.mockReturnValue({
      session: { userId: 'user-2', email: 'c@d.com', emailConfirmedAt: null },
      isLoading: false,
    })
    getProfileMock.mockResolvedValue({
      id: 'user-2',
      fullName: 'User Two',
      role: 'mentor',
      templeGroupId: null,
      isActive: true,
    })

    rerender()

    // Different user id -> different query key -> no cached data to leak,
    // even for the instant before the new fetch resolves.
    expect(result.current.data?.fullName).not.toBe('User One')

    await waitFor(() => expect(result.current.data?.fullName).toBe('User Two'))
  })
})
