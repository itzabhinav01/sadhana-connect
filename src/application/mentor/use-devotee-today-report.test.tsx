import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDevoteeTodayReport } from '@/application/mentor/use-devotee-today-report'
import { getLocalDateIso } from '@sadhana-connect/shared'

const { useAuthMock, getReportByDateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  getReportByDateMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase/sadhana-report-repository', () => ({
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

describe('useDevoteeTodayReport', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    getReportByDateMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it("fetches the devotee's report for today's local date", async () => {
    getReportByDateMock.mockResolvedValue(null)

    const { result } = renderHook(() => useDevoteeTodayReport('devotee-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getReportByDateMock).toHaveBeenCalledWith('devotee-1', getLocalDateIso())
  })

  it('resolves to null (not an error) when the devotee has not submitted today', async () => {
    getReportByDateMock.mockResolvedValue(null)

    const { result } = renderHook(() => useDevoteeTodayReport('devotee-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})
