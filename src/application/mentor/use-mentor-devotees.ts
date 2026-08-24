import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { calculateMentorDevoteeSummaries } from '@/application/mentor/mentor-devotee-summary'
import { mentorQueryKeys } from '@/application/mentor/mentor-query-keys'
import { supabaseMentorRepository } from '@sadhana-connect/infra-supabase/mentor-repository'
import { addDaysIso, getLocalDateIso } from '@/shared/utils/date'

// Used for recent activity, today's rounds/submission, and dashboard
// monitoring generally (approved Phase 12 decision #3).
export const MENTOR_RECENT_ACTIVITY_WINDOW_DAYS = 7

// Exactly two batched requests regardless of how many devotees are
// assigned (plus the all-time last-report-date view, also a single
// request) — never one request per devotee. See mentor-repository.ts.
export function useMentorDevotees() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: mentorQueryKeys.devotees(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('useMentorDevotees: no authenticated user')
      }

      const devotees = await supabaseMentorRepository.listAssignedDevotees(userId)
      if (devotees.length === 0) {
        return []
      }

      const today = getLocalDateIso()
      const windowStart = addDaysIso(today, -(MENTOR_RECENT_ACTIVITY_WINDOW_DAYS - 1))
      const devoteeIds = devotees.map((devotee) => devotee.devoteeId)

      const [recentReports, lastReportDates] = await Promise.all([
        supabaseMentorRepository.listReportsForDevotees(devoteeIds, windowStart),
        supabaseMentorRepository.listLastReportDates(),
      ])

      return calculateMentorDevoteeSummaries(
        devotees,
        recentReports,
        lastReportDates,
        today,
      )
    },
    enabled: userId !== null,
  })
}
