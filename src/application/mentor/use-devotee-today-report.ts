import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { mentorQueryKeys } from '@/application/mentor/mentor-query-keys'
import { supabaseSadhanaReportRepository } from '@/infrastructure/supabase/sadhana-report-repository'
import { getLocalDateIso } from '@/shared/utils/date'

// Reuses the existing, unmodified SadhanaReportRepository — getReportByDate
// already takes an explicit profileId, so passing the devotee's id works
// exactly as it does for the devotee's own dashboard. RLS decides what
// comes back; null means either "not submitted today" or "not accessible"
// (indistinguishable by design — see the detail page).
export function useDevoteeTodayReport(devoteeId: string) {
  const { session } = useAuth()
  const mentorUserId = session?.userId ?? null
  const today = getLocalDateIso()

  return useQuery({
    queryKey: mentorQueryKeys.devoteeToday(mentorUserId, devoteeId, today),
    queryFn: () =>
      supabaseSadhanaReportRepository.getReportByDate(devoteeId, today),
    enabled: mentorUserId !== null,
  })
}
