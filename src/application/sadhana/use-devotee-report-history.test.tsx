import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDevoteeReportHistory } from '@/application/sadhana/use-devotee-report-history'

const { useAuthMock, listReportHistoryMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listReportHistoryMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/infra-supabase/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: { listReportHistory: listReportHistoryMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDevoteeReportHistory', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listReportHistoryMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('fetches the given devotee and range when enabled', async () => {
    listReportHistoryMock.mockResolvedValue([])

    const { result } = renderHook(
      () => useDevoteeReportHistory('devotee-1', '2026-01-01', '2026-01-07'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listReportHistoryMock).toHaveBeenCalledWith('devotee-1', '2026-01-01', '2026-01-07')
  })

  it('does not fetch when enabled is false (e.g. an invalid range)', () => {
    const { result } = renderHook(
      () =>
        useDevoteeReportHistory('devotee-1', '2026-01-07', '2026-01-01', { enabled: false }),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(listReportHistoryMock).not.toHaveBeenCalled()
  })

  it('does not fetch when there is no authenticated viewer', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(
      () => useDevoteeReportHistory('devotee-1', '2026-01-01', '2026-01-07'),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(listReportHistoryMock).not.toHaveBeenCalled()
  })
})
