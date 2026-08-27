import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementCommentQueryKeys } from './announcement-comment-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAnnouncementCommentRepository } from '@sadhana-connect/infra-supabase'

interface UpdateAnnouncementCommentInput {
  commentId: string
  commentText: string
}

// Own-comment only — enforced by RLS (announcement_comments_update), not
// this hook. No mentor/admin override: editing someone else's exact
// wording was never requested (only moderation via delete was).
export function useUpdateAnnouncementComment(announcementId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ commentId, commentText }: UpdateAnnouncementCommentInput) =>
      supabaseAnnouncementCommentRepository.updateComment(commentId, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementCommentQueryKeys.list(userId, announcementId),
      })
    },
  })
}
