import { useInfiniteQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { sadhanaQueryKeys } from './sadhana-query-keys'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import { getLocalDateIso } from '@sadhana-connect/shared'

export const HISTORY_PAGE_SIZE = 20

export interface SadhanaHistoryFilters {
  fromDate?: string
  toDate?: string
}

// Deliberately does NOT use placeholderData/keepPreviousData: when the
// filters change, the query key changes, and TanStack Query's default
// behavior (no data, isPending: true, until the new key resolves) is
// exactly what's wanted here — the UI must never show results from the
// previous filter while the new query loads.
export function useSadhanaHistory(filters: SadhanaHistoryFilters) {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  // The effective upper bound never exceeds local "today", regardless of
  // what toDate was passed — the database has no CHECK constraint
  // preventing a future report_date row from existing, so this is
  // enforced here rather than assumed.
  const today = getLocalDateIso()
  const effectiveToDate =
    filters.toDate && filters.toDate < today ? filters.toDate : today

  return useInfiniteQuery({
    queryKey: sadhanaQueryKeys.history(userId, filters.fromDate, effectiveToDate),
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('useSadhanaHistory: no authenticated user')
      }
      return supabaseSadhanaReportRepository.listReports(userId, {
        fromDate: filters.fromDate,
        toDate: effectiveToDate,
        limit: HISTORY_PAGE_SIZE,
        cursor: pageParam,
      })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: userId !== null,
  })
}
