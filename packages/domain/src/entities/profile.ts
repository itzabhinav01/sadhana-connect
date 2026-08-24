export type AppRole = 'devotee' | 'mentor' | 'super_admin'

export interface Profile {
  id: string
  fullName: string
  role: AppRole
  templeGroupId: string | null
  isActive: boolean
  // E.164-formatted or null. Compulsory at registration (Phase 20C) but
  // nullable at the DB level — an existing account may not have one yet.
  phoneNumber: string | null
}
