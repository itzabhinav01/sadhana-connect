import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDevoteeFullReportHistory } from './use-devotee-full-report-history'

const { useAuthMock, listFullReportsInRangeMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listFullReportsInRangeMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseSadhanaReportRepository: { listFullReportsInRange: listFullReportsInRangeMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDevoteeFullReportHistory', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listFullReportsInRangeMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('fetches full reports for the given devotee and range when enabled', async () => {
    listFullReportsInRangeMock.mockResolvedValue([])

    const { result } = renderHook(
      () => useDevoteeFullReportHistory('devotee-1', '2026-01-01', '2026-01-07'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listFullReportsInRangeMock).toHaveBeenCalledWith('devotee-1', '2026-01-01', '2026-01-07')
  })

  it('does not fetch when enabled is false', () => {
    const { result } = renderHook(
      () =>
        useDevoteeFullReportHistory('devotee-1', '2026-01-07', '2026-01-01', { enabled: false }),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(listFullReportsInRangeMock).not.toHaveBeenCalled()
  })

  it('does not fetch when there is no authenticated viewer', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(
      () => useDevoteeFullReportHistory('devotee-1', '2026-01-01', '2026-01-07'),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(listFullReportsInRangeMock).not.toHaveBeenCalled()
  })
})
