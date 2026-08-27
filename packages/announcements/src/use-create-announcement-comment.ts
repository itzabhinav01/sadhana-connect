import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementCommentQueryKeys } from './announcement-comment-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { useProfile } from '@sadhana-connect/auth'
import { supabaseAnnouncementCommentRepository } from '@sadhana-connect/infra-supabase'

// authorName is captured here, from the caller's own live profile, at
// the moment of posting — becoming the permanent snapshot stored on the
// row. Mirrors useAddComment exactly. RLS (announcement_comments_insert)
// is what actually authorizes who may post on which announcement — a
// devotee on any visible announcement, a mentor only on one they
// authored, a super admin on any — this hook performs no such check
// itself.
export function useCreateAnnouncementComment(announcementId: string) {
  const { session } = useAuth()
  const profile = useProfile()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (commentText: string) => {
      if (!userId) {
        throw new Error('useCreateAnnouncementComment: no authenticated user')
      }
      if (!profile.data?.fullName) {
        throw new Error('useCreateAnnouncementComment: profile not loaded')
      }
      return supabaseAnnouncementCommentRepository.createComment({
        announcementId,
        authorId: userId,
        authorName: profile.data.fullName,
        commentText,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementCommentQueryKeys.list(userId, announcementId),
      })
    },
  })
}
