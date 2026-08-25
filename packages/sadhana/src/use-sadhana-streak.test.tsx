import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RECENT_REPORTS_LOOKBACK_LIMIT } from './use-recent-sadhana-reports'
import { useSadhanaStreak } from './use-sadhana-streak'
import { useRecentSadhanaReports } from './use-recent-sadhana-reports'
import { getLocalDateIso } from '@sadhana-connect/shared'

const { useAuthMock, listRecentReportsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listRecentReportsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
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

describe('useSadhanaStreak', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listRecentReportsMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('computes the streak from the same lookback-limited query used for recent reports', async () => {
    const today = getLocalDateIso()
    listRecentReportsMock.mockResolvedValue([{ reportDate: today }])

    const { result } = renderHook(() => useSadhanaStreak(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(1)
    expect(listRecentReportsMock).toHaveBeenCalledWith(
      'user-1',
      RECENT_REPORTS_LOOKBACK_LIMIT,
    )
  })

  it('shares a single network request with useRecentSadhanaReports (same query key)', async () => {
    listRecentReportsMock.mockResolvedValue([])
    const wrapper = createWrapper()

    const { result: streakResult } = renderHook(() => useSadhanaStreak(), {
      wrapper,
    })
    const { result: recentResult } = renderHook(
      () => useRecentSadhanaReports(),
      { wrapper },
    )

    await waitFor(() => expect(streakResult.current.isSuccess).toBe(true))
    await waitFor(() => expect(recentResult.current.isSuccess).toBe(true))

    expect(listRecentReportsMock).toHaveBeenCalledTimes(1)
  })
})
