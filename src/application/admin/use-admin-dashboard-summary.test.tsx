import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdminDashboardSummary } from '@/application/admin/use-admin-dashboard-summary'

const { useAuthMock, fromMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fromMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({ useAuth: useAuthMock }))
vi.mock('@sadhana-connect/infra-supabase/client', () => ({
  getSupabaseClient: () => ({ from: fromMock }),
}))

interface ChainResult {
  data?: unknown
  count?: number | null
  error?: unknown
}

// A minimal thenable stand-in for supabase-js's own chainable query
// builder: every filter method returns itself, and it resolves to the
// configured result whether the caller stops after .select() or chains
// further .eq()/.is()/.not() calls, exactly mirroring the real builder.
function chain(result: ChainResult) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    not: vi.fn(() => builder),
    then: (resolve: (value: ChainResult) => void) => Promise.resolve(result).then(resolve),
  }
  return builder
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// fromMock is called in exactly this order, synchronously, once per
// Promise.all entry in fetchDashboardSummary — mockReturnValueOnce calls
// below rely on that fixed order.
function mockQueries({
  activeMentorAssignmentDevoteeIds,
  devoteesTotal,
}: {
  activeMentorAssignmentDevoteeIds: { devotee_id: string }[]
  devoteesTotal: number
}) {
  fromMock
    .mockReturnValueOnce(chain({ count: 10, error: null })) // totalDevotees
    .mockReturnValueOnce(chain({ count: 3, error: null })) // totalMentors
    .mockReturnValueOnce(chain({ count: 8, error: null })) // activeCount
    .mockReturnValueOnce(chain({ count: 2, error: null })) // disabledCount
    .mockReturnValueOnce(chain({ count: 0, error: null })) // anonymizedCount
    .mockReturnValueOnce(chain({ count: 1, error: null })) // totalTempleGroups
    .mockReturnValueOnce(chain({ data: activeMentorAssignmentDevoteeIds, error: null }))
    .mockReturnValueOnce(chain({ count: devoteesTotal, error: null })) // active devotees
    .mockReturnValueOnce(chain({ count: 4, error: null })) // reportsSubmittedToday
}

describe('useAdminDashboardSummary', () => {
  beforeEach(() => {
    fromMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('counts devotees without a mentor by DISTINCT devotee_id, not by active-assignment row count', async () => {
    // A devotee can now have up to 3 active mentors (approved cap) — 3
    // active rows here belong to only 2 distinct devotees, so the naive
    // pre-multi-mentor row-count approach (10 - 3 = 7) would have been
    // wrong; the correct distinct count gives 10 - 2 = 8.
    mockQueries({
      activeMentorAssignmentDevoteeIds: [
        { devotee_id: 'devotee-1' },
        { devotee_id: 'devotee-1' },
        { devotee_id: 'devotee-2' },
      ],
      devoteesTotal: 10,
    })

    const { result } = renderHook(() => useAdminDashboardSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.devoteesWithoutActiveMentor).toBe(8)
  })

  it('never returns a negative devoteesWithoutActiveMentor figure', async () => {
    mockQueries({
      activeMentorAssignmentDevoteeIds: [
        { devotee_id: 'devotee-1' },
        { devotee_id: 'devotee-2' },
        { devotee_id: 'devotee-3' },
      ],
      devoteesTotal: 2,
    })

    const { result } = renderHook(() => useAdminDashboardSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.devoteesWithoutActiveMentor).toBe(0)
  })
})
