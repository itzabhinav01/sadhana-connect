import type { MentorAssignedDevotee } from '@/domain/entities/mentor-devotee'
import type {
  DevoteeLastReportDate,
  MentorRepository,
} from '@/domain/repositories/mentor-repository'
import {
  mapSadhanaReportRow,
  SADHANA_REPORT_SELECT_COLUMNS,
  type SadhanaReportRow,
} from '@/infrastructure/supabase/sadhana-report-repository'
import { supabase } from '@/infrastructure/supabase/client'

interface AssignedDevoteeRow {
  devotee_id: string
  assigned_at: string
  // PostgREST returns the embedded belongs-to resource as an object, or
  // null when the embedded row is blocked by the embedded table's own RLS
  // (e.g. a disabled devotee) — never a partial/broken row.
  devotee: { id: string; full_name: string; is_active: boolean } | null
}

export const supabaseMentorRepository: MentorRepository = {
  async listAssignedDevotees(mentorId) {
    const { data, error } = await supabase
      .from('mentor_assignments')
      .select(
        'devotee_id, assigned_at, devotee:profiles!mentor_assignments_devotee_id_fkey(id, full_name, is_active)',
      )
      .eq('mentor_id', mentorId)
      .eq('is_active', true)

    if (error) throw error

    const rows = data as unknown as AssignedDevoteeRow[]

    return rows
      .filter(
        (row): row is AssignedDevoteeRow & { devotee: NonNullable<AssignedDevoteeRow['devotee']> } =>
          row.devotee !== null && row.devotee.is_active,
      )
      .map(
        (row): MentorAssignedDevotee => ({
          devoteeId: row.devotee_id,
          fullName: row.devotee.full_name,
          assignedAt: row.assigned_at,
        }),
      )
  },

  async listReportsForDevotees(devoteeIds, fromDate) {
    if (devoteeIds.length === 0) return []

    const { data, error } = await supabase
      .from('sadhana_reports')
      .select(SADHANA_REPORT_SELECT_COLUMNS)
      .in('profile_id', devoteeIds)
      .gte('report_date', fromDate)
      .order('report_date', { ascending: false })

    if (error) throw error

    return (data as SadhanaReportRow[]).map(mapSadhanaReportRow)
  },

  async listLastReportDates() {
    const { data, error } = await supabase
      .from('mentor_devotee_last_reports')
      .select('devotee_id, last_report_date')

    if (error) throw error

    return (data ?? []).map(
      (row): DevoteeLastReportDate => ({
        devoteeId: row.devotee_id,
        lastReportDate: row.last_report_date,
      }),
    )
  },

  async getAssignedSince(mentorId, devoteeId) {
    const { data, error } = await supabase
      .from('mentor_assignments')
      .select('assigned_at')
      .eq('mentor_id', mentorId)
      .eq('devotee_id', devoteeId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error

    return data?.assigned_at ?? null
  },
}
