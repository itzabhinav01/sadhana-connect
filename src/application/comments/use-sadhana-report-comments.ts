import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { supabaseSadhanaReportCommentRepository } from '@sadhana-connect/infra-supabase/sadhana-report-comment-repository'

// `enabled` is caller-supplied and required (not defaulted to true) so a
// report row's comment thread is only ever fetched once the mentor or
// devotee actually expands it — never prefetched for every report in a
// list, which would be exactly the N+1 pattern this phase's plan ruled
// out.
export function useSadhanaReportComments(
  sadhanaReportId: string,
  enabled: boolean,
) {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: commentQueryKeys.list(userId, sadhanaReportId),
    queryFn: () =>
      supabaseSadhanaReportCommentRepository.listComments(sadhanaReportId),
    enabled: userId !== null && enabled,
  })
}
