import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { sadhanaQueryKeys } from './sadhana-query-keys'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'

// Bounded lookback shared by the "recent reports" list and the streak
// calculation (see useSadhanaStreak) — both read this exact query (same
// key, same limit), so showing them together costs one network request,
// not two. See sadhana-streak.ts for this window's known limitation.
export const RECENT_REPORTS_LOOKBACK_LIMIT = 60

export function useRecentSadhanaReports(
  limit: number = RECENT_REPORTS_LOOKBACK_LIMIT,
) {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: sadhanaQueryKeys.recent(userId, limit),
    queryFn: () => {
      if (!userId) {
        throw new Error('useRecentSadhanaReports: no authenticated user')
      }
      return supabaseSadhanaReportRepository.listRecentReports(userId, limit)
    },
    enabled: userId !== null,
  })
}
