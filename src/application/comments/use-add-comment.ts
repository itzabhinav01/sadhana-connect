import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { useProfile } from '@/application/profile/use-profile'
import { supabaseSadhanaReportCommentRepository } from '@sadhana-connect/infra-supabase/sadhana-report-comment-repository'

// mentorName is captured here, from the mentor's own live profile, at the
// moment of posting — becoming the permanent snapshot stored on the row.
// RLS (sadhana_report_comments_insert) is what actually authorizes this;
// this hook does not attempt its own "am I really the mentor" check.
export function useAddComment(sadhanaReportId: string) {
  const { session } = useAuth()
  const profile = useProfile()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (commentText: string) => {
      if (!userId) {
        throw new Error('useAddComment: no authenticated user')
      }
      if (!profile.data?.fullName) {
        throw new Error('useAddComment: mentor profile not loaded')
      }
      return supabaseSadhanaReportCommentRepository.createComment({
        sadhanaReportId,
        mentorId: userId,
        mentorName: profile.data.fullName,
        commentText,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.list(userId, sadhanaReportId),
      })
    },
  })
}
