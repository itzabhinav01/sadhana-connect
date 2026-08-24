import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { mentorQueryKeys } from '@/application/mentor/mentor-query-keys'
import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { profileQueryKeys } from '@/application/profile/profile-query-keys'
import { sadhanaQueryKeys } from '@/application/sadhana/sadhana-query-keys'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase/auth-repository'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => supabaseAuthRepository.signOut(),
    onSuccess: () => {
      // Removed, not just invalidated: a signed-out route tree renders
      // nothing profile/report-dependent, so there is no refetch to serve
      // — the goal is that no stale data remains in the cache at all. This
      // is also what prevents a mentor's assigned-devotee data, comments,
      // or announcements from ever surviving into a different account's
      // session after logout.
      queryClient.removeQueries({ queryKey: profileQueryKeys.all })
      queryClient.removeQueries({ queryKey: sadhanaQueryKeys.all })
      queryClient.removeQueries({ queryKey: mentorQueryKeys.all })
      queryClient.removeQueries({ queryKey: commentQueryKeys.all })
      queryClient.removeQueries({ queryKey: announcementQueryKeys.all })
      queryClient.removeQueries({ queryKey: adminQueryKeys.all })
      queryClient.removeQueries({ queryKey: notificationQueryKeys.all })
    },
  })
}
