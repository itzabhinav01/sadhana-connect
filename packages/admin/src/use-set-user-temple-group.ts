import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from './admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminUserRepository } from '@sadhana-connect/infra-supabase'

// Unblocks the announcement flow: a mentor can only ever publish with
// scope: 'temple_group' using their OWN temple_group_id
// (can_publish_announcement), and a devotee only sees temple_group
// announcements matching their own — so a null templeGroupId leaves both
// permanently unable to send/receive that scope until a super admin sets
// this. RLS + protect_profile_restricted_columns is the real enforcement;
// this is a single UPDATE under existing grants, same as setUserActive.
export function useSetUserTempleGroup() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ userId, templeGroupId }: { userId: string; templeGroupId: string | null }) =>
      supabaseAdminUserRepository.setUserTempleGroup(userId, templeGroupId),
    // Traced: affects this user's own detail view and the Users list
    // (temple group is not currently a displayed/filtered column there,
    // but the row itself is refetched as part of the same query). Does
    // not touch mentor_assignments, temple_groups, or the dashboard
    // summary (no temple-group-scoped figure exists there).
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.userDetail(adminUserId, variables.userId),
      })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', adminUserId],
      })
    },
  })
}
