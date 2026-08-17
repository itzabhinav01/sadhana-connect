import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { sadhanaQueryKeys } from '@/application/sadhana/sadhana-query-keys'
import { calculateWeeklySummary } from '@/application/sadhana/sadhana-weekly-summary'
import { supabaseSadhanaReportRepository } from '@/infrastructure/supabase/sadhana-report-repository'
import { addDaysIso, getLocalDateIso } from '@/shared/utils/date'

// Trailing 7 days ending today (approved product decision, Phase 7) —
// not a Mon-Sun calendar week, so the chart/summary always has a fixed
// 7-day shape regardless of what day of the week it is.
const TRAILING_WINDOW_DAYS = 7

export function useWeeklySadhanaSummary() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  const endDate = getLocalDateIso()
  const startDate = addDaysIso(endDate, -(TRAILING_WINDOW_DAYS - 1))

  const query = useQuery({
    queryKey: sadhanaQueryKeys.range(userId, startDate, endDate),
    queryFn: () => {
      if (!userId) {
        throw new Error('useWeeklySadhanaSummary: no authenticated user')
      }
      return supabaseSadhanaReportRepository.listReportsInRange(
        userId,
        startDate,
        endDate,
      )
    },
    enabled: userId !== null,
  })

  return {
    ...query,
    data: query.data
      ? calculateWeeklySummary(query.data, startDate, endDate)
      : undefined,
  }
}
