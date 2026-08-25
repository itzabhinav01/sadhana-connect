import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import {
  MentorCapReachedError,
  useAssignMentor,
} from '@/application/admin/use-assign-mentor'

const { useAuthMock, assignMentorMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  assignMentorMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({ useAuth: useAuthMock }))
vi.mock('@sadhana-connect/infra-supabase/admin-assignment-repository', () => ({
  supabaseAdminAssignmentRepository: { assignMentor: assignMentorMock },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const assignmentResult = {
  id: 'assignment-2',
  mentorId: 'mentor-2',
  mentorName: 'New Mentor',
  devoteeId: 'devotee-1',
  devoteeName: 'Test Devotee',
  isActive: true,
  assignedAt: '2026-01-15T00:00:00.000Z',
  unassignedAt: null,
}

describe('useAssignMentor', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    assignMentorMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('assigns the devotee to the given mentor', async () => {
    assignMentorMock.mockResolvedValue(assignmentResult)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useAssignMentor(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ devoteeId: 'devotee-1', mentorId: 'mentor-2' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(assignMentorMock).toHaveBeenCalledWith('devotee-1', 'mentor-2')
  })

  it('invalidates only the domains an assignment actually affects, never the blanket adminQueryKeys.all', async () => {
    assignMentorMock.mockResolvedValue(assignmentResult)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAssignMentor(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ devoteeId: 'devotee-1', mentorId: 'mentor-2' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'assignments', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.mentorDevoteeCounts('admin-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'mentor-devotee-count', 'admin-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.dashboardSummary('admin-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(4)
  })

  it('translates a MENTOR_CAP_REACHED repository error into a typed MentorCapReachedError', async () => {
    assignMentorMock.mockRejectedValue(
      new Error('MENTOR_CAP_REACHED: This devotee already has the maximum of 3 active mentors.'),
    )
    const { result } = renderHook(() => useAssignMentor(), {
      wrapper: createWrapper(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    })

    result.current.mutate({ devoteeId: 'devotee-1', mentorId: 'mentor-2' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(MentorCapReachedError)
  })

  it('translates a MENTOR_CAP_REACHED error even when it is a plain object, not an Error instance', async () => {
    assignMentorMock.mockRejectedValue({
      message: 'MENTOR_CAP_REACHED: This devotee already has the maximum of 3 active mentors.',
      code: 'P0001',
      details: null,
      hint: null,
    })
    const { result } = renderHook(() => useAssignMentor(), {
      wrapper: createWrapper(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    })

    result.current.mutate({ devoteeId: 'devotee-1', mentorId: 'mentor-2' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(MentorCapReachedError)
  })

  it('passes through a non-cap error unchanged', async () => {
    assignMentorMock.mockRejectedValue(new Error('mentor_id must be an active profile'))
    const { result } = renderHook(() => useAssignMentor(), {
      wrapper: createWrapper(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    })

    result.current.mutate({ devoteeId: 'devotee-1', mentorId: 'mentor-2' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(MentorCapReachedError)
    expect(result.current.error?.message).toBe('mentor_id must be an active profile')
  })
})
