import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDevoteeAssignedSince } from '@/application/mentor/use-devotee-assigned-since'

const { useAuthMock, getAssignedSinceMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  getAssignedSinceMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase/mentor-repository', () => ({
  supabaseMentorRepository: { getAssignedSince: getAssignedSinceMock },
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

describe('useDevoteeAssignedSince', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    getAssignedSinceMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('fetches fresh, scoped by the current mentor and the given devoteeId', async () => {
    getAssignedSinceMock.mockResolvedValue('2025-01-01T00:00:00.000Z')

    const { result } = renderHook(() => useDevoteeAssignedSince('devotee-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getAssignedSinceMock).toHaveBeenCalledWith('mentor-1', 'devotee-1')
    expect(result.current.data).toBe('2025-01-01T00:00:00.000Z')
  })

  it('resolves to null when there is no active assignment', async () => {
    getAssignedSinceMock.mockResolvedValue(null)

    const { result } = renderHook(() => useDevoteeAssignedSince('unassigned-devotee'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})
