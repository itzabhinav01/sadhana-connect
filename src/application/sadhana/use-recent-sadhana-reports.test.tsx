import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RECENT_REPORTS_LOOKBACK_LIMIT,
  useRecentSadhanaReports,
} from '@/application/sadhana/use-recent-sadhana-reports'

const { useAuthMock, listRecentReportsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listRecentReportsMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: {
    listRecentReports: listRecentReportsMock,
  },
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

describe('useRecentSadhanaReports', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listRecentReportsMock.mockReset()
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useRecentSadhanaReports(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listRecentReportsMock).not.toHaveBeenCalled()
  })

  it('defaults to the shared lookback limit, scoped to the user', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listRecentReportsMock.mockResolvedValue([])

    const { result } = renderHook(() => useRecentSadhanaReports(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listRecentReportsMock).toHaveBeenCalledWith(
      'user-1',
      RECENT_REPORTS_LOOKBACK_LIMIT,
    )
  })

  it('respects an explicit limit', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listRecentReportsMock.mockResolvedValue([])

    const { result } = renderHook(() => useRecentSadhanaReports(5), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listRecentReportsMock).toHaveBeenCalledWith('user-1', 5)
  })
})
