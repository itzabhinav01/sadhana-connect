import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sadhanaQueryKeys } from './sadhana-query-keys'
import { useSadhanaAnalytics } from './use-sadhana-analytics'

const { useAuthMock, listReportsInRangeMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listReportsInRangeMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
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

describe('useSadhanaAnalytics', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listReportsInRangeMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(
      () => useSadhanaAnalytics('2026-01-01', '2026-01-31'),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(listReportsInRangeMock).not.toHaveBeenCalled()
  })

  it('does not fetch when disabled (e.g. an invalid range)', () => {
    listReportsInRangeMock.mockResolvedValue([])

    const { result } = renderHook(
      () =>
        useSadhanaAnalytics('2026-01-31', '2026-01-01', { enabled: false }),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(listReportsInRangeMock).not.toHaveBeenCalled()
  })

  it('uses the shared range query key, scoped to the user and the given (non-7-day) dates', async () => {
    listReportsInRangeMock.mockResolvedValue([])

    const { result } = renderHook(
      () => useSadhanaAnalytics('2026-01-01', '2026-01-31'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(listReportsInRangeMock).toHaveBeenCalledWith(
      'user-1',
      '2026-01-01',
      '2026-01-31',
    )
  })

  it('derives the analytics summary from the fetched reports', async () => {
    listReportsInRangeMock.mockResolvedValue([
      { reportDate: '2026-01-15', totalRounds: 16, readingMinutes: 15, hearingMinutes: 30, dayRestMinutes: 0, totalRestMinutes: 0 },
    ])

    const { result } = renderHook(
      () => useSadhanaAnalytics('2026-01-09', '2026-01-15'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalReports).toBe(1)
    expect(result.current.data?.totalRounds).toBe(16)
    expect(result.current.data?.roundsChartData).toHaveLength(7)
  })

  it('caches a 30-day range under a distinct key from a 7-day range for the same user', async () => {
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

    listReportsInRangeMock.mockResolvedValue([])

    const { result: weekResult } = renderHook(
      () => useSadhanaAnalytics('2026-01-09', '2026-01-15'),
      { wrapper: Wrapper },
    )
    const { result: monthResult } = renderHook(
      () => useSadhanaAnalytics('2026-01-01', '2026-01-31'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(weekResult.current.isSuccess).toBe(true))
    await waitFor(() => expect(monthResult.current.isSuccess).toBe(true))

    expect(listReportsInRangeMock).toHaveBeenCalledTimes(2)
    expect(
      queryClient.getQueryData(
        sadhanaQueryKeys.range('user-1', '2026-01-09', '2026-01-15'),
      ),
    ).toBeDefined()
    expect(
      queryClient.getQueryData(
        sadhanaQueryKeys.range('user-1', '2026-01-01', '2026-01-31'),
      ),
    ).toBeDefined()
  })

  it('never shows a previous user\'s analytics after switching users', async () => {
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

    listReportsInRangeMock.mockResolvedValue([
      { reportDate: '2026-01-15', totalRounds: 16, readingMinutes: 0, hearingMinutes: 0, dayRestMinutes: 0, totalRestMinutes: 0 },
    ])

    const { result, rerender } = renderHook(
      () => useSadhanaAnalytics('2026-01-09', '2026-01-15'),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalRounds).toBe(16)

    useAuthMock.mockReturnValue({
      session: { userId: 'user-2', email: 'c@d.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listReportsInRangeMock.mockResolvedValue([])

    rerender()

    expect(result.current.data?.totalRounds).not.toBe(16)

    await waitFor(() => expect(result.current.data?.totalRounds).toBe(0))
  })
})
