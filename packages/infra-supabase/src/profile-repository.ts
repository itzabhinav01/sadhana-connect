import type { Profile } from '@sadhana-connect/domain'
import type { ProfileRepository } from '@sadhana-connect/domain'
import { getSupabaseClient } from './client'

interface ProfileRow {
  id: string
  full_name: string
  role: Profile['role']
  temple_group_id: string | null
  is_active: boolean
  phone_number: string | null
}

const SELECT_COLUMNS = 'id, full_name, role, temple_group_id, is_active, phone_number'

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    templeGroupId: row.temple_group_id,
    isActive: row.is_active,
    phoneNumber: row.phone_number,
  }
}

export const supabaseProfileRepository: ProfileRepository = {
  async getProfile(userId: string) {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select(SELECT_COLUMNS)
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error

    return data ? mapProfile(data) : null
  },

  async updatePhoneNumber(userId, phoneNumber) {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .update({ phone_number: phoneNumber })
      .eq('id', userId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapProfile(data as ProfileRow)
  },

  async updateProfile(userId, updates) {
    const patch: Record<string, unknown> = {}
    if (updates.fullName !== undefined) {
      patch.full_name = updates.fullName
    }
    if (updates.phoneNumber !== undefined) {
      patch.phone_number = updates.phoneNumber
    }

    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapProfile(data as ProfileRow)
  },
}
