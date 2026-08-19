import type { AdminMentorAssignment } from '@/domain/entities/mentor-assignment'
import type {
  AdminAssignmentFilters,
  AdminAssignmentRepository,
  MentorDevoteeCount,
} from '@/domain/repositories/admin-assignment-repository'
import { supabase } from '@/infrastructure/supabase/client'

interface AssignmentRow {
  id: string
  mentor_id: string
  devotee_id: string
  is_active: boolean
  assigned_at: string
  unassigned_at: string | null
  mentor: { full_name: string } | null
  devotee: { full_name: string } | null
}

const SELECT_COLUMNS =
  'id, mentor_id, devotee_id, is_active, assigned_at, unassigned_at, mentor:profiles!mentor_assignments_mentor_id_fkey(full_name), devotee:profiles!mentor_assignments_devotee_id_fkey(full_name)'

function mapRow(row: AssignmentRow): AdminMentorAssignment {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    mentorName: row.mentor?.full_name ?? 'Unknown',
    devoteeId: row.devotee_id,
    devoteeName: row.devotee?.full_name ?? 'Unknown',
    isActive: row.is_active,
    assignedAt: row.assigned_at,
    unassignedAt: row.unassigned_at,
  }
}

export const supabaseAdminAssignmentRepository: AdminAssignmentRepository = {
  async listAssignments(filters: AdminAssignmentFilters) {
    let query = supabase
      .from('mentor_assignments')
      .select(SELECT_COLUMNS)
      .order('assigned_at', { ascending: false })

    if (filters.mentorId) {
      query = query.eq('mentor_id', filters.mentorId)
    }
    if (filters.devoteeId) {
      query = query.eq('devotee_id', filters.devoteeId)
    }

    const { data, error } = await query

    if (error) throw error

    return (data as unknown as AssignmentRow[]).map(mapRow)
  },

  async reassignDevotee(devoteeId, newMentorId) {
    // RPC to public.reassign_devotee(uuid, uuid) — SECURITY INVOKER,
    // atomic, relies entirely on the caller's own RLS privileges (see
    // migration 0005). No authorization logic here.
    const { data, error } = await supabase.rpc('reassign_devotee', {
      p_devotee_id: devoteeId,
      p_new_mentor_id: newMentorId,
    })

    if (error) throw error

    const row = data as unknown as {
      id: string
      mentor_id: string
      devotee_id: string
      is_active: boolean
      assigned_at: string
      unassigned_at: string | null
    }

    return {
      id: row.id,
      mentorId: row.mentor_id,
      mentorName: '',
      devoteeId: row.devotee_id,
      devoteeName: '',
      isActive: row.is_active,
      assignedAt: row.assigned_at,
      unassignedAt: row.unassigned_at,
    }
  },

  async deactivateAssignment(assignmentId) {
    const { error } = await supabase
      .from('mentor_assignments')
      .update({ is_active: false, unassigned_at: new Date().toISOString() })
      .eq('id', assignmentId)

    if (error) throw error
  },

  async listMentorDevoteeCounts() {
    const { data, error } = await supabase
      .from('admin_mentor_assignment_counts')
      .select('mentor_id, active_devotee_count')

    if (error) throw error

    return (data ?? []).map(
      (row): MentorDevoteeCount => ({
        mentorId: row.mentor_id,
        activeDevoteeCount: row.active_devotee_count,
      }),
    )
  },

  async getMentorDevoteeCount(mentorId) {
    const { data, error } = await supabase
      .from('admin_mentor_assignment_counts')
      .select('active_devotee_count')
      .eq('mentor_id', mentorId)
      .maybeSingle()

    if (error) throw error

    return data?.active_devotee_count ?? 0
  },
}
