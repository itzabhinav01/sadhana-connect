import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/application/auth/use-auth'
import { sadhanaQueryKeys } from '@/application/sadhana/sadhana-query-keys'
import type { UpsertSadhanaReportParams } from '@/domain/repositories/sadhana-report-repository'
import { supabaseSadhanaReportRepository } from '@/infrastructure/supabase/sadhana-report-repository'

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
    },
  })
}
