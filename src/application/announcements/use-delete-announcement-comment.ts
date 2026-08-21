import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementCommentQueryKeys } from '@/application/announcements/announcement-comment-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAnnouncementCommentRepository } from '@/infrastructure/supabase/announcement-comment-repository'

// Hard delete. RLS (announcement_comments_delete) allows: the comment's
// own author, the announcement's own author moderating their thread, or
// a super admin — this hook performs no such check itself.
export function useDeleteAnnouncementComment(announcementId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (commentId: string) =>
      supabaseAnnouncementCommentRepository.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementCommentQueryKeys.list(userId, announcementId),
      })
    },
  })
}
