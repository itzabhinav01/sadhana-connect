import { useQuery } from '@tanstack/react-query'

import { announcementCommentQueryKeys } from '@/application/announcements/announcement-comment-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAnnouncementCommentRepository } from '@/infrastructure/supabase/announcement-comment-repository'

// `enabled` mirrors useSadhanaReportComments: only fetched once the
// announcement detail view actually needs the thread, never prefetched
// for every card in the feed (avoids an N+1 over the announcement list).
export function useAnnouncementComments(announcementId: string, enabled: boolean) {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: announcementCommentQueryKeys.list(userId, announcementId),
    queryFn: () => supabaseAnnouncementCommentRepository.listComments(announcementId),
    enabled: userId !== null && enabled,
  })
}
