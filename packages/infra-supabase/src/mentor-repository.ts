import type { MentorAssignedDevotee, MentorDevoteeGroup } from '@sadhana-connect/domain'
import type { MentorDevoteeReportSummary } from '@sadhana-connect/domain'
import type {
  DevoteeLastReportDate,
  MentorRepository,
} from '@sadhana-connect/domain'
import { getSupabaseClient } from './client'

interface AssignedDevoteeRow {
  devotee_id: string
  assigned_at: string
  // PostgREST returns the embedded belongs-to resource as an object, or
  // null when the embedded row is blocked by the embedded table's own RLS
  // (e.g. a disabled devotee) — never a partial/broken row.
  devotee: {
    id: string
    full_name: string
    is_active: boolean
    temple_group_id?: string | null
  } | null
}

// Narrowed (Phase 20 performance) to exactly the fields
// calculateMentorDevoteeSummaries reads — traced, not guessed. This is
// its own select rather than SADHANA_REPORT_SELECT_COLUMNS because this
// method's one consumer (useMentorDevotees) never reads anything beyond
// these three fields for any assigned devotee's report.
export const DEVOTEE_REPORT_SUMMARY_SELECT_COLUMNS = 'profile_id, report_date, total_rounds'

interface DevoteeReportSummaryRow {
  profile_id: string
  report_date: string
  total_rounds: number
}

function mapDevoteeReportSummaryRow(
  row: DevoteeReportSummaryRow,
): MentorDevoteeReportSummary {
  return {
    profileId: row.profile_id,
    reportDate: row.report_date,
    totalRounds: row.total_rounds,
  }
}

export const supabaseMentorRepository: MentorRepository = {
  async listAssignedDevotees(mentorId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('mentor_assignments')
      .select(
        'devotee_id, assigned_at, devotee:profiles!mentor_assignments_devotee_id_fkey(id, full_name, is_active, temple_group_id)',
      )
      .eq('mentor_id', mentorId)
      .eq('is_active', true)

    if (error) throw error

    const rows = (data as unknown as AssignedDevoteeRow[]).filter(
      (row): row is AssignedDevoteeRow & { devotee: NonNullable<AssignedDevoteeRow['devotee']> } =>
        row.devotee !== null && row.devotee.is_active,
    )

    if (rows.length === 0) {
      return []
    }

    const devoteeIds = rows.map((row) => row.devotee_id)
    const groupsByDevotee = new Map<string, MentorDevoteeGroup[]>()

    try {
      const [{ data: allGroupsData }, { data: membershipsData }] = await Promise.all([
        client.from('temple_groups').select('id, name').order('name', { ascending: true }),
        client
          .from('profile_temple_groups')
          .select('profile_id, temple_group_id')
          .in('profile_id', devoteeIds)
          .order('created_at', { ascending: true }),
      ])

      const groupNameById = new Map<string, string>()
      for (const g of (allGroupsData ?? []) as { id: string; name: string }[]) {
        groupNameById.set(g.id, g.name)
      }

      for (const m of (membershipsData ?? []) as {
        profile_id: string
        temple_group_id: string
      }[]) {
        const name = groupNameById.get(m.temple_group_id)
        if (!name) continue
        const existing = groupsByDevotee.get(m.profile_id) ?? []
        if (!existing.some((item) => item.id === m.temple_group_id)) {
          existing.push({ id: m.temple_group_id, name })
          groupsByDevotee.set(m.profile_id, existing)
        }
      }

      // Fallback to profiles.temple_group_id if profile_temple_groups returned no rows for a devotee
      for (const row of rows) {
        const primaryGroupId = row.devotee.temple_group_id
        if (primaryGroupId && !groupsByDevotee.has(row.devotee_id)) {
          const name = groupNameById.get(primaryGroupId)
          if (name) {
            groupsByDevotee.set(row.devotee_id, [{ id: primaryGroupId, name }])
          }
        }
      }
    } catch {
      // Gracefully proceed with empty templeGroups if group lookup fails
    }

    return rows.map(
      (row): MentorAssignedDevotee => ({
        devoteeId: row.devotee_id,
        fullName: row.devotee.full_name,
        assignedAt: row.assigned_at,
        templeGroups: groupsByDevotee.get(row.devotee_id) ?? [],
      }),
    )
  },

  async listReportsForDevotees(devoteeIds, fromDate) {
    if (devoteeIds.length === 0) return []

    const { data, error } = await getSupabaseClient()
      .from('sadhana_reports')
      .select(DEVOTEE_REPORT_SUMMARY_SELECT_COLUMNS)
      .in('profile_id', devoteeIds)
      .gte('report_date', fromDate)
      .order('report_date', { ascending: false })

    if (error) throw error

    return (data as DevoteeReportSummaryRow[]).map(mapDevoteeReportSummaryRow)
  },

  async listLastReportDates() {
    const { data, error } = await getSupabaseClient()
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
    const { data, error } = await getSupabaseClient()
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
