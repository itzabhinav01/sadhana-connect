import { useQuery } from '@tanstack/react-query'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAnnouncementRepository } from '@sadhana-connect/infra-supabase/announcement-repository'

// One RLS-filtered list query per page load — no per-scope branching
// client-side, no role checks. announcements_select already returns
// exactly what this viewer is allowed to see (published + scope match,
// or their own drafts, or the broader super-admin reach).
export function useAnnouncements() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: announcementQueryKeys.list(userId),
    queryFn: () => supabaseAnnouncementRepository.listVisibleAnnouncements(),
    enabled: userId !== null,
  })
}
