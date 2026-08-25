import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@sadhana-connect/auth'
import { sadhanaQueryKeys } from './sadhana-query-keys'
import type { UpsertSadhanaReportParams } from '@sadhana-connect/domain'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'

export function useUpsertSadhanaReport() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (params: UpsertSadhanaReportParams) => {
      if (!userId) {
        throw new Error('useUpsertSadhanaReport: no authenticated user')
      }
      return supabaseSadhanaReportRepository.upsertReport(userId, params)
    },
    onSuccess: (report) => {
      // Seed the cache directly from the saved row rather than
      // invalidating — avoids an extra round-trip and guarantees the form
      // reflects exactly what the server accepted.
      queryClient.setQueryData(
        sadhanaQueryKeys.detail(userId, report.reportDate),
        report,
      )

      // The dashboard's weekly summary/chart, recent-reports/streak, and
      // History views are all derived from this same table — invalidate
      // (not set) since recomputing them here would duplicate logic
      // those hooks/pages already own. Scoped to range/recent/history
      // only, so the detail query just seeded above isn't redundantly
      // refetched.
      queryClient.invalidateQueries({ queryKey: sadhanaQueryKeys.rangeAll })
      queryClient.invalidateQueries({ queryKey: sadhanaQueryKeys.recentAll })
      queryClient.invalidateQueries({ queryKey: sadhanaQueryKeys.historyAll })
    },
  })
}
