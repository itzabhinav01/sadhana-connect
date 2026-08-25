import { calculateStreak } from './sadhana-streak'
import {
  RECENT_REPORTS_LOOKBACK_LIMIT,
  useRecentSadhanaReports,
} from './use-recent-sadhana-reports'
import { getLocalDateIso } from '@sadhana-connect/shared'

// Shares the exact query (same key/limit) as useRecentSadhanaReports, so
// rendering the streak alongside the recent-reports list costs one
// network request, not two.
export function useSadhanaStreak() {
  const query = useRecentSadhanaReports(RECENT_REPORTS_LOOKBACK_LIMIT)

  return {
    ...query,
    data: query.data
      ? calculateStreak(
          query.data.map((report) => report.reportDate),
          getLocalDateIso(),
        )
      : undefined,
  }
}
