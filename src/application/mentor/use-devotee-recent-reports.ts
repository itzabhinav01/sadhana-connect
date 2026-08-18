import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { mentorQueryKeys } from '@/application/mentor/mentor-query-keys'
import { supabaseSadhanaReportRepository } from '@/infrastructure/supabase/sadhana-report-repository'

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
