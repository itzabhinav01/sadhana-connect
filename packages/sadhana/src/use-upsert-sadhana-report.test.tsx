import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sadhanaQueryKeys } from './sadhana-query-keys'
import { useUpsertSadhanaReport } from './use-upsert-sadhana-report'
import type { UpsertSadhanaReportParams } from '@sadhana-connect/domain'

const { useAuthMock, upsertReportMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  upsertReportMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseSadhanaReportRepository: { upsertReport: upsertReportMock },
}))

const params: UpsertSadhanaReportParams = {
  reportDate: '2026-01-15',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: null,
  totalRounds: 12,
  readingMinutes: 0,
  bookName: null,
  hearingMinutes: 0,
  speakerName: null,
  sleepTime: null,
  wakeTime: null,
  dayRestMinutes: 0,
  totalRestMinutes: 0,
  officeGoingTime: null,
  officeReturnTime: null,
  notes: null,
  signatureText: 'Test Devotee',
}

describe('useUpsertSadhanaReport', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    upsertReportMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('upserts scoped to the authenticated user', async () => {
    upsertReportMock.mockResolvedValue({ id: 'report-1', ...params })
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

    const { result } = renderHook(() => useUpsertSadhanaReport(), {
      wrapper: Wrapper,
    })

    result.current.mutate(params)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(upsertReportMock).toHaveBeenCalledWith('user-1', params)
  })

  it('seeds the cache for that exact user+date key on success', async () => {
    const savedReport = { id: 'report-1', ...params }
    upsertReportMock.mockResolvedValue(savedReport)
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

    const { result } = renderHook(() => useUpsertSadhanaReport(), {
      wrapper: Wrapper,
    })

    result.current.mutate(params)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(
      queryClient.getQueryData(
        sadhanaQueryKeys.detail('user-1', '2026-01-15'),
      ),
    ).toEqual(savedReport)
  })

  it('invalidates the range, recent, and history dashboard/history queries on success', async () => {
    const savedReport = { id: 'report-1', ...params }
    upsertReportMock.mockResolvedValue(savedReport)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const rangeKey = sadhanaQueryKeys.range('user-1', '2026-01-09', '2026-01-15')
    const recentKey = sadhanaQueryKeys.recent('user-1', 60)
    const historyKey = sadhanaQueryKeys.history('user-1', undefined, '2026-01-15')
    queryClient.setQueryData(rangeKey, [{ reportDate: '2026-01-14' }])
    queryClient.setQueryData(recentKey, [{ reportDate: '2026-01-14' }])
    queryClient.setQueryData(historyKey, {
      pages: [{ reports: [{ reportDate: '2026-01-14' }] }],
    })

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useUpsertSadhanaReport(), {
      wrapper: Wrapper,
    })

    result.current.mutate(params)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryState(rangeKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(recentKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(historyKey)?.isInvalidated).toBe(true)
  })

  it('invalidates a non-7-day (e.g. Analytics 30-day) range query too, since it shares the same rangeAll prefix', async () => {
    const savedReport = { id: 'report-1', ...params }
    upsertReportMock.mockResolvedValue(savedReport)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const analyticsRangeKey = sadhanaQueryKeys.range(
      'user-1',
      '2026-01-01',
      '2026-01-31',
    )
    queryClient.setQueryData(analyticsRangeKey, [{ reportDate: '2026-01-14' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useUpsertSadhanaReport(), {
      wrapper: Wrapper,
    })

    result.current.mutate(params)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryState(analyticsRangeKey)?.isInvalidated).toBe(
      true,
    )
  })

  it('does not invalidate the detail query it just seeded via setQueryData', async () => {
    const savedReport = { id: 'report-1', ...params }
    upsertReportMock.mockResolvedValue(savedReport)
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

    const { result } = renderHook(() => useUpsertSadhanaReport(), {
      wrapper: Wrapper,
    })

    result.current.mutate(params)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(
      queryClient.getQueryState(
        sadhanaQueryKeys.detail('user-1', '2026-01-15'),
      )?.isInvalidated,
    ).toBe(false)
  })
})
