import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDevoteeRecentReports } from '@/application/mentor/use-devotee-recent-reports'

const { useAuthMock, listRecentReportsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listRecentReportsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: { listRecentReports: listRecentReportsMock },
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

describe('useDevoteeRecentReports', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listRecentReportsMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('fetches the given devoteeId with the default limit', async () => {
    listRecentReportsMock.mockResolvedValue([])

    const { result } = renderHook(() => useDevoteeRecentReports('devotee-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listRecentReportsMock).toHaveBeenCalledWith('devotee-1', 5)
  })
})
