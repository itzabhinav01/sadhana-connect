import type { TempleGroup } from '@sadhana-connect/domain/entities/temple-group'
import type { AdminTempleGroupRepository } from '@sadhana-connect/domain/repositories/admin-temple-group-repository'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase/client'

interface TempleGroupRow {
  id: string
  name: string
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS = 'id, name, created_at, updated_at'

function mapRow(row: TempleGroupRow): TempleGroup {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const supabaseAdminTempleGroupRepository: AdminTempleGroupRepository = {
  async listTempleGroups() {
    const { data, error } = await getSupabaseClient()
      .from('temple_groups')
      .select(SELECT_COLUMNS)
      .order('name', { ascending: true })

    if (error) throw error

    return (data as TempleGroupRow[]).map(mapRow)
  },

  async createTempleGroup(name) {
    const { data, error } = await getSupabaseClient()
      .from('temple_groups')
      .insert({ name })
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as TempleGroupRow)
  },

  async renameTempleGroup(id, name) {
    const { data, error } = await getSupabaseClient()
      .from('temple_groups')
      .update({ name })
      .eq('id', id)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as TempleGroupRow)
  },

  async deleteTempleGroup(id) {
    const { error } = await getSupabaseClient().from('temple_groups').delete().eq('id', id)

    if (error) throw error
  },
}
