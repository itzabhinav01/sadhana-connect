import { describe, expect, it, vi } from 'vitest'

import { supabaseAdminAssignmentRepository } from '@sadhana-connect/infra-supabase/admin-assignment-repository'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('@sadhana-connect/infra-supabase/client', () => ({
  getSupabaseClient: () => ({ from: fromMock }),
}))

// admin_mentor_assignment_counts (migration 0005) only has a row for a
// mentor with at least one active assignment — a mentor with zero active
// devotees produces no row at all, not a zero-valued row. This is the
// exact case the role-change gate (useMentorDevoteeCount) depends on
// being treated as 0, not as a query error.
describe('supabaseAdminAssignmentRepository.getMentorDevoteeCount', () => {
  it('returns 0 when the view has no row for this mentor, without treating it as an error', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    fromMock.mockReturnValue({ select })

    const count = await supabaseAdminAssignmentRepository.getMentorDevoteeCount('mentor-1')

    expect(count).toBe(0)
    expect(fromMock).toHaveBeenCalledWith('admin_mentor_assignment_counts')
    expect(eq).toHaveBeenCalledWith('mentor_id', 'mentor-1')
  })

  it('returns the row value when the view does have a row for this mentor', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { active_devotee_count: 4 },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    fromMock.mockReturnValue({ select })

    const count = await supabaseAdminAssignmentRepository.getMentorDevoteeCount('mentor-2')

    expect(count).toBe(4)
  })

  it('still throws on a genuine query error, rather than silently returning 0', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('connection lost'),
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    fromMock.mockReturnValue({ select })

    await expect(
      supabaseAdminAssignmentRepository.getMentorDevoteeCount('mentor-3'),
    ).rejects.toThrow('connection lost')
  })
})
