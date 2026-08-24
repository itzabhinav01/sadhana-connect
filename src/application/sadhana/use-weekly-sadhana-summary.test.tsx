import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWeeklySadhanaSummary } from '@/application/sadhana/use-weekly-sadhana-summary'
import { getLocalDateIso } from '@/shared/utils/date'

const { useAuthMock, listReportsInRangeMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listReportsInRangeMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: {
    listReportsInRange: listReportsInRangeMock,
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

describe('useWeeklySadhanaSummary', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listReportsInRangeMock.mockReset()
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useWeeklySadhanaSummary(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listReportsInRangeMock).not.toHaveBeenCalled()
  })

  it('requests a trailing 7-day range ending today, scoped to the user', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listReportsInRangeMock.mockResolvedValue([])

    const { result } = renderHook(() => useWeeklySadhanaSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const today = getLocalDateIso()
    expect(listReportsInRangeMock).toHaveBeenCalledTimes(1)
    const [profileId, startDate, endDate] =
      listReportsInRangeMock.mock.calls[0]
    expect(profileId).toBe('user-1')
    expect(endDate).toBe(today)
    // 6 days before today -> 7 days inclusive.
    const expectedDayCount =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        86_400_000 +
      1
    expect(expectedDayCount).toBe(7)
  })

  it('derives the weekly summary from the fetched reports', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    const today = getLocalDateIso()
    listReportsInRangeMock.mockResolvedValue([
      { reportDate: today, totalRounds: 16, readingMinutes: 15, hearingMinutes: 30 },
    ])

    const { result } = renderHook(() => useWeeklySadhanaSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalReports).toBe(1)
    expect(result.current.data?.chartData).toHaveLength(7)
  })

  it('never shows a previous user\'s weekly data after switching users', async () => {
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
    const today = getLocalDateIso()
    listReportsInRangeMock.mockResolvedValue([
      { reportDate: today, totalRounds: 16, readingMinutes: 0, hearingMinutes: 0 },
    ])

    const { result, rerender } = renderHook(() => useWeeklySadhanaSummary(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalReports).toBe(1)

    useAuthMock.mockReturnValue({
      session: { userId: 'user-2', email: 'c@d.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listReportsInRangeMock.mockResolvedValue([])

    rerender()

    expect(result.current.data?.totalReports).not.toBe(1)

    await waitFor(() => expect(result.current.data?.totalReports).toBe(0))
  })
})
