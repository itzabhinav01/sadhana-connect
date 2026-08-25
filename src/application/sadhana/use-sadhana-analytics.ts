import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { calculateSadhanaAnalytics } from '@/application/sadhana/sadhana-analytics'
import { sadhanaQueryKeys } from '@/application/sadhana/sadhana-query-keys'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase/sadhana-report-repository'

// Reuses the exact same range/rangeAll query keys and listReportsInRange
// repository method Phase 7's weekly summary already uses — this is a
// generalization to an arbitrary range, not a new query shape. That
// means the existing rangeAll invalidation (on Sadhana save) and the
// existing logout cleanup already cover Analytics with no changes.
//
// `enabled` lets the caller (AnalyticsPage) withhold the fetch entirely
// for an invalid range (see validateDateRange) rather than querying with
// dates it already knows are wrong.
export function useSadhanaAnalytics(
  fromDate: string,
  toDate: string,
  options: { enabled?: boolean } = {},
) {
  const { session } = useAuth()
  const userId = session?.userId ?? null
  const enabled = (options.enabled ?? true) && userId !== null

  const query = useQuery({
    queryKey: sadhanaQueryKeys.range(userId, fromDate, toDate),
    queryFn: () => {
      if (!userId) {
        throw new Error('useSadhanaAnalytics: no authenticated user')
      }
      return supabaseSadhanaReportRepository.listReportsInRange(
        userId,
        fromDate,
        toDate,
      )
    },
    enabled,
  })

  return {
    ...query,
    data: query.data
      ? calculateSadhanaAnalytics(query.data, fromDate, toDate)
      : undefined,
  }
}
