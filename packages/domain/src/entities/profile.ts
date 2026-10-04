export type AppRole = 'devotee' | 'mentor' | 'super_admin'

export interface Profile {
  id: string
  fullName: string
  role: AppRole
  templeGroupId: string | null
  templeGroupIds?: string[]
  isActive: boolean
  // E.164-formatted or null. Compulsory at registration (Phase 20C) but
  // nullable at the DB level — an existing account may not have one yet.
  phoneNumber: string | null
  whatsappShareNumber?: string | null
}

export function getEffectiveTempleGroupIds(
  entity?: { templeGroupId: string | null; templeGroupIds?: string[] } | null,
): string[] {
  if (!entity) return []
  if (entity.templeGroupIds && entity.templeGroupIds.length > 0) {
    return entity.templeGroupIds
  }
  return entity.templeGroupId ? [entity.templeGroupId] : []
}

