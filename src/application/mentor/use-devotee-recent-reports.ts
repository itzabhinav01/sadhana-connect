import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { mentorQueryKeys } from '@sadhana-connect/mentor'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'

export const DEVOTEE_RECENT_REPORTS_LIMIT = 5

// Reuses the existing, unmodified SadhanaReportRepository — same reasoning
// as useDevoteeTodayReport.
export function useDevoteeRecentReports(
  devoteeId: string,
  limit: number = DEVOTEE_RECENT_REPORTS_LIMIT,
) {
  const { session } = useAuth()
  const mentorUserId = session?.userId ?? null

  return useQuery({
    queryKey: mentorQueryKeys.devoteeRecent(mentorUserId, devoteeId, limit),
    queryFn: () =>
      supabaseSadhanaReportRepository.listRecentReports(devoteeId, limit),
    enabled: mentorUserId !== null,
  })
}
