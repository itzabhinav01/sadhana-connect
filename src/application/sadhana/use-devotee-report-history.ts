import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { sadhanaQueryKeys } from '@/application/sadhana/sadhana-query-keys'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase/sadhana-report-repository'

// Devotee oversight (Phase 20B) — used by both MentorDevoteeDetailPage
// and AdminUserDetailPage via the shared DevoteeSadhanaHistorySection.
// RLS (sadhana_reports_select's is_mentor_of()/is_super_admin() branches)
// is the real authorization boundary; this hook performs no role check
// of its own, same convention as every other query in this codebase.
export function useDevoteeReportHistory(
  devoteeId: string,
  fromDate: string,
  toDate: string,
  options: { enabled?: boolean } = {},
) {
  const { session } = useAuth()
  const viewerUserId = session?.userId ?? null
  const enabled = (options.enabled ?? true) && viewerUserId !== null

  return useQuery({
    queryKey: sadhanaQueryKeys.devoteeHistory(viewerUserId, devoteeId, fromDate, toDate),
    queryFn: () =>
      supabaseSadhanaReportRepository.listReportHistory(devoteeId, fromDate, toDate),
    enabled,
  })
}
