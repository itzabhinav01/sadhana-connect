import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import type { AppRole } from '@/domain/entities/profile'
import { supabaseAdminAssignmentRepository } from '@/infrastructure/supabase/admin-assignment-repository'
import { supabaseAdminUserRepository } from '@/infrastructure/supabase/admin-user-repository'

// Exact required copy — surfaced both by the presentation-time gate (which
// disables the Mentor -> Devotee option using useMentorDevoteeCount) and by
// this mutation's own pre-submit re-check, so the message is identical
// regardless of which path caught it.
export const MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE =
  "This mentor still has active devotees. Reassign or deactivate all active devotees before changing the mentor's role."

export class MentorHasActiveDevoteesError extends Error {
  constructor() {
    super(MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE)
    this.name = 'MentorHasActiveDevoteesError'
  }
}

interface ChangeUserRoleInput {
  userId: string
  currentRole: AppRole
  newRole: AppRole
}

// Devotee -> Mentor, Devotee -> Super Admin: always allowed by the
// application, no gate.
//
// Mentor -> anything else (Devotee or Super Admin): protected by two
// application-layer checks — (1) the presentation-time gate in
// AdminUserRoleControl, which disables every non-mentor option using
// useMentorDevoteeCount, and (2) this mutation's own pre-submit
// re-check, immediately before issuing the profiles UPDATE. Both
// destinations carry the identical risk (an active mentor_assignments
// row pointing at a profile that is no longer role='mentor'), so both
// are gated the same way — not just the original Mentor -> Devotee path.
//
// KNOWN RACE, DELIBERATELY NOT CLOSED IN THIS PHASE: both checks are plain
// read-then-write application logic, not an atomic database invariant —
// there is no CHECK constraint, trigger, or transaction tying the
// mentor_assignments count to the profiles.role UPDATE. Two concurrent
// admins (or a second reassignment landing between this hook's read and
// its write) could both observe count = 0 and both proceed, or a
// reassignment could complete in the gap between the read here and the
// UPDATE. If this happens, the database does not currently hard-block
// the resulting role change (see the Phase 14 design note); the accepted
// containment is that private.is_mentor_of() already requires
// mentor.role = 'mentor', so the relationship becomes inert to RLS the
// instant the role changes — the worst outcome is an orphaned
// mentor_assignments row, not an unauthorized-access exposure. Per the
// approved decision, validate_mentor_assignment_roles() is NOT modified
// and no new migration is introduced to close this gap in this phase;
// revisit only if a demonstrated need arises.
export function useChangeUserRole() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: async ({ userId, currentRole, newRole }: ChangeUserRoleInput) => {
      if (currentRole === 'mentor' && newRole !== 'mentor') {
        const activeCount = await supabaseAdminAssignmentRepository.getMentorDevoteeCount(userId)
        if (activeCount > 0) {
          throw new MentorHasActiveDevoteesError()
        }
      }
      await supabaseAdminUserRepository.changeUserRole(userId, newRole)
    },
    // Traced (Phase 20): a role change affects this user's own detail
    // view, the Users list (role is a filtered/displayed column), and the
    // dashboard's totalDevotees/totalMentors figures. It can also add or
    // remove this user from mentor-devotee-count views (a new mentor
    // appears with a zero count; mentor -> devotee is only ever allowed
    // once their count is already zero, per the guard above) — so both
    // count namespaces are invalidated too. It never touches
    // mentor_assignments rows themselves or temple_groups, so those are
    // deliberately left untouched.
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.userDetail(adminUserId, variables.userId),
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.mentorDevoteeCounts(adminUserId),
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'mentor-devotee-count', adminUserId],
      })
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardSummary(adminUserId),
      })
    },
  })
}
