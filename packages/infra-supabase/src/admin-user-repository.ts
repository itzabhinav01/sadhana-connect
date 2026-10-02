import type { AppRole } from '@sadhana-connect/domain'
import type { AdminUser } from '@sadhana-connect/domain'
import type {
  AdminUserListParams,
  AdminUserListPage,
  AdminUserRepository,
} from '@sadhana-connect/domain'
import { getSupabaseClient } from './client'

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

function mapRow(row: AdminUserRow, templeGroupIds?: string[]): AdminUser {
  const effectiveGroupIds =
    templeGroupIds && templeGroupIds.length > 0
      ? templeGroupIds
      : row.temple_group_id
        ? [row.temple_group_id]
        : []
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    templeGroupId: effectiveGroupIds[0] ?? row.temple_group_id ?? null,
    templeGroupIds: effectiveGroupIds,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
  }
}

async function fetchUserTempleGroupIds(userId: string): Promise<string[]> {
  const { data, error } = await getSupabaseClient()
    .from('profile_temple_groups')
    .select('temple_group_id')
    .eq('profile_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    return []
  }

  return (data as { temple_group_id: string }[]).map((row) => row.temple_group_id)
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

    const rawRows = data as AdminUserRow[]
    const hasNextPage = rawRows.length > params.limit
    const pageRows = hasNextPage ? rawRows.slice(0, params.limit) : rawRows

    const groupIdsByUser = new Map<string, string[]>()
    if (pageRows.length > 0) {
      const { data: membershipRows } = await getSupabaseClient()
        .from('profile_temple_groups')
        .select('profile_id, temple_group_id')
        .in(
          'profile_id',
          pageRows.map((r) => r.id),
        )
        .order('created_at', { ascending: true })

      for (const m of (membershipRows ?? []) as { profile_id: string; temple_group_id: string }[]) {
        const list = groupIdsByUser.get(m.profile_id) ?? []
        list.push(m.temple_group_id)
        groupIdsByUser.set(m.profile_id, list)
      }
    }

    const users = pageRows.map((row) => mapRow(row, groupIdsByUser.get(row.id)))
    const nextCursor = hasNextPage ? (users[users.length - 1]?.createdAt ?? null) : null

    return { users, nextCursor }
  },

  async getUserById(id) {
    const [{ data, error }, groupIds] = await Promise.all([
      getSupabaseClient().from('profiles').select(SELECT_COLUMNS).eq('id', id).maybeSingle(),
      fetchUserTempleGroupIds(id),
    ])

    if (error) throw error

    return data ? mapRow(data as AdminUserRow, groupIds) : null
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

  async setUserTempleGroup(id, templeGroupId) {
    const client = getSupabaseClient()

    if (templeGroupId === null) {
      await client.from('profile_temple_groups').delete().eq('profile_id', id)
      const { error } = await client
        .from('profiles')
        .update({ temple_group_id: null })
        .eq('id', id)

      if (error) throw error
      return
    }

    // Check current memberships to toggle (add if not member, remove if already member)
    const currentGroupIds = await fetchUserTempleGroupIds(id)

    if (currentGroupIds.includes(templeGroupId)) {
      const { error: delError } = await client
        .from('profile_temple_groups')
        .delete()
        .eq('profile_id', id)
        .eq('temple_group_id', templeGroupId)

      if (delError) throw delError

      const remaining = currentGroupIds.filter((gid) => gid !== templeGroupId)
      const { error: updateError } = await client
        .from('profiles')
        .update({ temple_group_id: remaining[0] ?? null })
        .eq('id', id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await client
        .from('profile_temple_groups')
        .insert({ profile_id: id, temple_group_id: templeGroupId })

      if (insertError) {
        // Fallback if profile_temple_groups is not yet migrated on the DB instance
        const { error: fallbackError } = await client
          .from('profiles')
          .update({ temple_group_id: templeGroupId })
          .eq('id', id)
        if (fallbackError) throw fallbackError
        return
      }

      if (currentGroupIds.length === 0) {
        const { error: updateError } = await client
          .from('profiles')
          .update({ temple_group_id: templeGroupId })
          .eq('id', id)

        if (updateError) throw updateError
      }
    }
  },
}

