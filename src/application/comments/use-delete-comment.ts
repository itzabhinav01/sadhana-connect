import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { supabaseSadhanaReportCommentRepository } from '@/infrastructure/supabase/sadhana-report-comment-repository'

// Hard delete, author-only, only while still the current active mentor —
// enforced by RLS (sadhana_report_comments_delete), not by this hook.
export function useDeleteComment(sadhanaReportId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (commentId: string) =>
      supabaseSadhanaReportCommentRepository.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.list(userId, sadhanaReportId),
      })
    },
  })
}
