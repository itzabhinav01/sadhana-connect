import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSadhanaReport } from '@/application/sadhana/use-sadhana-report'

const { useAuthMock, getReportByDateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  getReportByDateMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@/infrastructure/supabase/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: { getReportByDate: getReportByDateMock },
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

describe('useSadhanaReport', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    getReportByDateMock.mockReset()
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useSadhanaReport('2026-01-15'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getReportByDateMock).not.toHaveBeenCalled()
  })

  it('fetches the report scoped to the authenticated user and given date', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    getReportByDateMock.mockResolvedValue(null)

    const { result } = renderHook(() => useSadhanaReport('2026-01-15'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getReportByDateMock).toHaveBeenCalledWith('user-1', '2026-01-15')
    expect(result.current.data).toBeNull()
  })

  it('never shows a previous date\'s report when the date switches', async () => {
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
    getReportByDateMock.mockResolvedValue({
      id: 'report-1',
      reportDate: '2026-01-15',
      signatureText: 'Day 15',
    })

    const { result, rerender } = renderHook(
      ({ date }) => useSadhanaReport(date),
      { wrapper: Wrapper, initialProps: { date: '2026-01-15' } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.signatureText).toBe('Day 15')

    getReportByDateMock.mockResolvedValue({
      id: 'report-2',
      reportDate: '2026-01-16',
      signatureText: 'Day 16',
    })

    rerender({ date: '2026-01-16' })

    // Different date -> different query key -> no stale data from the
    // previous date shown even for the instant before refetch resolves.
    expect(result.current.data?.signatureText).not.toBe('Day 15')

    await waitFor(() =>
      expect(result.current.data?.signatureText).toBe('Day 16'),
    )
  })
})
