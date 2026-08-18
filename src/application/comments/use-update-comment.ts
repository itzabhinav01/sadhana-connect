import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { supabaseSadhanaReportCommentRepository } from '@/infrastructure/supabase/sadhana-report-comment-repository'

interface UpdateCommentInput {
  commentId: string
  commentText: string
}

// Author-only, and only while still the current active mentor —
// enforced by RLS (sadhana_report_comments_update), not by this hook.
export function useUpdateComment(sadhanaReportId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ commentId, commentText }: UpdateCommentInput) =>
      supabaseSadhanaReportCommentRepository.updateComment(
        commentId,
        commentText,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.list(userId, sadhanaReportId),
      })
    },
  })
}
