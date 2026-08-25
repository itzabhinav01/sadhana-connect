import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { sadhanaQueryKeys } from './sadhana-query-keys'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'

// UX data only, same as useProfile — every access is independently
// enforced by RLS regardless of what this hook returns.
export function useSadhanaReport(reportDate: string) {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return useQuery({
    queryKey: sadhanaQueryKeys.detail(userId, reportDate),
    queryFn: () => {
      if (!userId) {
        throw new Error('useSadhanaReport: no authenticated user')
      }
      return supabaseSadhanaReportRepository.getReportByDate(
        userId,
        reportDate,
      )
    },
    enabled: userId !== null,
  })
}
