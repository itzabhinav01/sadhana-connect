import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabase } from '@/infrastructure/supabase/client'
import { getLocalDateIso } from '@/shared/utils/date'

export interface AdminDashboardSummary {
  totalDevotees: number
  totalMentors: number
  activeCount: number
  disabledCount: number
  anonymizedCount: number
  totalTempleGroups: number
  devoteesWithoutActiveMentor: number
  reportsSubmittedToday: number
}

// Every figure is a `{ count: 'exact', head: true }` query — no rows are
// ever fetched, only counts. Run in parallel via Promise.all rather than
// a single aggregate view: these are simple, independent counts, not
// worth a new migration object for.
async function fetchDashboardSummary(): Promise<AdminDashboardSummary> {
  const today = getLocalDateIso()

  const [
    totalDevotees,
    totalMentors,
    activeCount,
    disabledCount,
    anonymizedCount,
    totalTempleGroups,
    devoteesWithActiveMentor,
    devoteesTotal,
    reportsSubmittedToday,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'devotee'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'mentor'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', false)
      .is('anonymized_at', null),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('anonymized_at', 'is', null),
    supabase.from('temple_groups').select('id', { count: 'exact', head: true }),
    supabase
      .from('mentor_assignments')
      .select('devotee_id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'devotee')
      .eq('is_active', true),
    supabase
      .from('sadhana_reports')
      .select('id', { count: 'exact', head: true })
      .eq('report_date', today),
  ])

  for (const result of [
    totalDevotees,
    totalMentors,
    activeCount,
    disabledCount,
    anonymizedCount,
    totalTempleGroups,
    devoteesWithActiveMentor,
    devoteesTotal,
    reportsSubmittedToday,
  ]) {
    if (result.error) throw result.error
  }

  const withoutActiveMentor = Math.max(
    (devoteesTotal.count ?? 0) - (devoteesWithActiveMentor.count ?? 0),
    0,
  )

  return {
    totalDevotees: totalDevotees.count ?? 0,
    totalMentors: totalMentors.count ?? 0,
    activeCount: activeCount.count ?? 0,
    disabledCount: disabledCount.count ?? 0,
    anonymizedCount: anonymizedCount.count ?? 0,
    totalTempleGroups: totalTempleGroups.count ?? 0,
    devoteesWithoutActiveMentor: withoutActiveMentor,
    reportsSubmittedToday: reportsSubmittedToday.count ?? 0,
  }
}

export function useAdminDashboardSummary() {
  const { session } = useAuth()
  const adminUserId = session?.userId ?? null

  return useQuery({
    queryKey: adminQueryKeys.dashboardSummary(adminUserId),
    queryFn: fetchDashboardSummary,
    enabled: adminUserId !== null,
  })
}
