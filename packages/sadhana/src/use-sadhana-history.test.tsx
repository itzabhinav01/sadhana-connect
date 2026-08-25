import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  HISTORY_PAGE_SIZE,
  useSadhanaHistory,
} from './use-sadhana-history'
import { getLocalDateIso } from '@sadhana-connect/shared'

const { useAuthMock, listReportsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listReportsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseSadhanaReportRepository: { listReports: listReportsMock },
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

describe('useSadhanaHistory', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listReportsMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useSadhanaHistory({}), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listReportsMock).not.toHaveBeenCalled()
  })

  it('requests the first page with a null cursor, scoped to the user', async () => {
    listReportsMock.mockResolvedValue({ reports: [], nextCursor: null })

    const { result } = renderHook(() => useSadhanaHistory({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(listReportsMock).toHaveBeenCalledWith('user-1', {
      fromDate: undefined,
      toDate: getLocalDateIso(),
      limit: HISTORY_PAGE_SIZE,
      cursor: null,
    })
  })

  it('caps the effective toDate at local today even if a later date is requested', async () => {
    listReportsMock.mockResolvedValue({ reports: [], nextCursor: null })
    const future = '2999-01-01'

    const { result } = renderHook(
      () => useSadhanaHistory({ toDate: future }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [, options] = listReportsMock.mock.calls[0]
    expect(options.toDate).toBe(getLocalDateIso())
    expect(options.toDate).not.toBe(future)
  })

  it('passes through a toDate that is not in the future', async () => {
    listReportsMock.mockResolvedValue({ reports: [], nextCursor: null })

    const { result } = renderHook(
      () => useSadhanaHistory({ toDate: '2026-01-01' }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [, options] = listReportsMock.mock.calls[0]
    expect(options.toDate).toBe('2026-01-01')
  })

  it('fetches the next page using the previous page\'s nextCursor', async () => {
    listReportsMock
      .mockResolvedValueOnce({
        reports: [{ id: 'r1', reportDate: '2026-01-15' }],
        nextCursor: '2026-01-15',
      })
      .mockResolvedValueOnce({
        reports: [{ id: 'r2', reportDate: '2026-01-10' }],
        nextCursor: null,
      })

    const { result } = renderHook(() => useSadhanaHistory({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(true)

    await result.current.fetchNextPage()

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    expect(listReportsMock).toHaveBeenLastCalledWith(
      'user-1',
      expect.objectContaining({ cursor: '2026-01-15' }),
    )
    expect(result.current.hasNextPage).toBe(false)
  })

  it('never shows a previous user\'s history after switching users', async () => {
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

    listReportsMock.mockResolvedValue({
      reports: [{ id: 'r1', reportDate: '2026-01-15' }],
      nextCursor: null,
    })

    const { result, rerender } = renderHook(() => useSadhanaHistory({}), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0]?.reports).toHaveLength(1)

    useAuthMock.mockReturnValue({
      session: { userId: 'user-2', email: 'c@d.com', emailConfirmedAt: null },
      isLoading: false,
    })
    listReportsMock.mockResolvedValue({ reports: [], nextCursor: null })

    rerender()

    // Different user -> different query key -> no stale pages carried over.
    expect(result.current.data).toBeUndefined()

    await waitFor(() =>
      expect(result.current.data?.pages[0]?.reports).toHaveLength(0),
    )
  })

  it('starts a fresh query (no stale previous-filter data) when filters change', async () => {
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

    listReportsMock.mockResolvedValue({
      reports: [{ id: 'r1', reportDate: '2026-01-15' }],
      nextCursor: null,
    })

    const { result, rerender } = renderHook(
      ({ fromDate }) => useSadhanaHistory({ fromDate }),
      { wrapper: Wrapper, initialProps: { fromDate: '2026-01-01' } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0]?.reports).toHaveLength(1)

    listReportsMock.mockResolvedValue({ reports: [], nextCursor: null })
    rerender({ fromDate: '2025-01-01' })

    // No placeholderData configured -> data resets to undefined while the
    // new filter's (uncached) query is in flight, not the old results.
    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)

    await waitFor(() =>
      expect(result.current.data?.pages[0]?.reports).toHaveLength(0),
    )
  })
})
