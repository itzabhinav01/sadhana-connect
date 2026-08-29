import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { sadhanaQueryKeys } from './sadhana-query-keys'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'

// Devotee oversight full reports (all columns) — used by mentor and admin
// to export PDF/CSV/text and preview full reports in-app over a date range.
// RLS (sadhana_reports_select's is_mentor_of()/is_super_admin() branches)
// authorizes the mentor/admin caller to read another profile's reports.
export function useDevoteeFullReportHistory(
  devoteeId: string,
  fromDate: string,
  toDate: string,
  options: { enabled?: boolean } = {},
) {
  const { session } = useAuth()
  const viewerUserId = session?.userId ?? null
  const enabled = (options.enabled ?? true) && viewerUserId !== null

  return useQuery({
    queryKey: sadhanaQueryKeys.devoteeFullHistory(viewerUserId, devoteeId, fromDate, toDate),
    queryFn: () =>
      supabaseSadhanaReportRepository.listFullReportsInRange(devoteeId, fromDate, toDate),
    enabled,
  })
}
