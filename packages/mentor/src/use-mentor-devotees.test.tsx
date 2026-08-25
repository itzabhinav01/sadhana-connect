import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMentorDevotees } from './use-mentor-devotees'
import { getLocalDateIso } from '@sadhana-connect/shared'

const {
  useAuthMock,
  listAssignedDevoteesMock,
  listReportsForDevoteesMock,
  listLastReportDatesMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listAssignedDevoteesMock: vi.fn(),
  listReportsForDevoteesMock: vi.fn(),
  listLastReportDatesMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseMentorRepository: {
    listAssignedDevotees: listAssignedDevoteesMock,
    listReportsForDevotees: listReportsForDevoteesMock,
    listLastReportDates: listLastReportDatesMock,
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

describe('useMentorDevotees', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    listAssignedDevoteesMock.mockReset()
    listReportsForDevoteesMock.mockReset()
    listLastReportDatesMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('does not fetch when there is no authenticated user', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { result } = renderHook(() => useMentorDevotees(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(listAssignedDevoteesMock).not.toHaveBeenCalled()
  })

  it('resolves an empty list without batch-fetching reports when there are no assigned devotees', async () => {
    listAssignedDevoteesMock.mockResolvedValue([])

    const { result } = renderHook(() => useMentorDevotees(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
    expect(listReportsForDevoteesMock).not.toHaveBeenCalled()
    expect(listLastReportDatesMock).not.toHaveBeenCalled()
  })

  it('merges assigned devotees with a single batched report query and the last-report-date view', async () => {
    listAssignedDevoteesMock.mockResolvedValue([
      { devoteeId: 'd1', fullName: 'Devotee One', assignedAt: '2025-01-01T00:00:00.000Z' },
      { devoteeId: 'd2', fullName: 'Devotee Two', assignedAt: '2025-02-01T00:00:00.000Z' },
    ])
    const today = getLocalDateIso()
    listReportsForDevoteesMock.mockResolvedValue([
      {
        id: 'r1',
        profileId: 'd1',
        reportDate: today,
        roundsBefore430: 0,
        roundsTill7am: 0,
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
        signatureText: 'D1',
        createdAt: today,
        updatedAt: today,
      },
    ])
    listLastReportDatesMock.mockResolvedValue([
      { devoteeId: 'd1', lastReportDate: today },
      { devoteeId: 'd2', lastReportDate: '2025-06-01' },
    ])

    const { result } = renderHook(() => useMentorDevotees(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Exactly one call each — never per-devotee (N+1 guard).
    expect(listAssignedDevoteesMock).toHaveBeenCalledTimes(1)
    expect(listReportsForDevoteesMock).toHaveBeenCalledTimes(1)
    expect(listLastReportDatesMock).toHaveBeenCalledTimes(1)
    expect(listReportsForDevoteesMock).toHaveBeenCalledWith(
      ['d1', 'd2'],
      expect.any(String),
    )

    const d1 = result.current.data?.find((s) => s.devoteeId === 'd1')
    const d2 = result.current.data?.find((s) => s.devoteeId === 'd2')
    expect(d1?.hasSubmittedToday).toBe(true)
    expect(d1?.todayTotalRounds).toBe(12)
    expect(d2?.hasSubmittedToday).toBe(false)
    expect(d2?.lastReportDate).toBe('2025-06-01')
  })

  it('scopes the query key by the mentor userId, isolating cache across mentor accounts', async () => {
    listAssignedDevoteesMock.mockResolvedValue([])
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

    const { result, rerender } = renderHook(() => useMentorDevotees(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-2', email: 'm2@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    rerender()

    // Different mentor userId -> different query key -> no stale data leaks
    // even for the instant before the new fetch resolves.
    expect(result.current.data).toBeUndefined()
  })
})
