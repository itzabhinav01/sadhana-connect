import type { Profile } from '@/domain/entities/profile'
import type { ProfileRepository } from '@/domain/repositories/profile-repository'
import { supabase } from '@/infrastructure/supabase/client'

interface ProfileRow {
  id: string
  full_name: string
  role: Profile['role']
  temple_group_id: string | null
  is_active: boolean
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    templeGroupId: row.temple_group_id,
    isActive: row.is_active,
  }
}

export const supabaseProfileRepository: ProfileRepository = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, temple_group_id, is_active')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error

    return data ? mapProfile(data) : null
  },
}
