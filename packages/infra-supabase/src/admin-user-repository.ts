import type { AppRole } from '@sadhana-connect/domain/entities/profile'
import type { AdminUser } from '@sadhana-connect/domain/entities/admin-user'
import type {
  AdminUserListParams,
  AdminUserListPage,
  AdminUserRepository,
} from '@sadhana-connect/domain/repositories/admin-user-repository'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase/client'

interface AdminUserRow {
  id: string
  full_name: string
  role: AppRole
  is_active: boolean
  temple_group_id: string | null
  phone_number: string | null
  created_at: string
}

const SELECT_COLUMNS =
  'id, full_name, role, is_active, temple_group_id, phone_number, created_at'

function mapRow(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    templeGroupId: row.temple_group_id,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
  }
}

export const supabaseAdminUserRepository: AdminUserRepository = {
  async listUsers(params: AdminUserListParams): Promise<AdminUserListPage> {
    // limit + 1 to detect a next page, matching the exact cursor pattern
    // already established by supabaseSadhanaReportRepository.listReports —
    // no COUNT(*), no OFFSET pagination (would degrade at "thousands of
    // users" scale).
    let query = getSupabaseClient()
      .from('profiles')
      .select(SELECT_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(params.limit + 1)

    if (params.search && params.search.trim().length > 0) {
      query = query.ilike('full_name', `%${params.search.trim()}%`)
    }
    if (params.role) {
      query = query.eq('role', params.role)
    }
    if (params.status === 'active') {
      query = query.eq('is_active', true)
    } else if (params.status === 'disabled') {
      query = query.eq('is_active', false)
    }
    if (params.cursor) {
      query = query.lt('created_at', params.cursor)
    }

    const { data, error } = await query

    if (error) throw error

    const rows = (data as AdminUserRow[]).map(mapRow)
    const hasNextPage = rows.length > params.limit
    const users = hasNextPage ? rows.slice(0, params.limit) : rows
    const nextCursor = hasNextPage ? (users[users.length - 1]?.createdAt ?? null) : null

    return { users, nextCursor }
  },

  async getUserById(id) {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error

    return data ? mapRow(data as AdminUserRow) : null
  },

  async changeUserRole(id, role) {
    // RLS (profiles_update, is_super_admin() branch) + the
    // protect_profile_restricted_columns trigger are what actually
    // enforce that only a super admin can change this column — this call
    // relies on both, adds no elevated logic of its own.
    const { error } = await getSupabaseClient().from('profiles').update({ role }).eq('id', id)

    if (error) throw error
  },

  async setUserActive(id, isActive) {
    const { error } = await getSupabaseClient()
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  },
}
