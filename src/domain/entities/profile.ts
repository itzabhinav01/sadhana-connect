export type AppRole = 'devotee' | 'mentor' | 'super_admin'

export interface Profile {
  id: string
  fullName: string
  role: AppRole
  templeGroupId: string | null
  isActive: boolean
}
