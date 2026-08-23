import type { AppRole } from '@/domain/entities/profile'

// Phase 20C: 'anonymized' removed — deletion is now a true hard delete
// (see admin-account-actions' hard_delete), so no row can ever end up in
// that state again. Status is derived purely from is_active.
export type AdminUserStatus = 'active' | 'disabled'

export function deriveAdminUserStatus(isActive: boolean): AdminUserStatus {
  return isActive ? 'active' : 'disabled'
}

export interface AdminUser {
  id: string
  fullName: string
  role: AppRole
  isActive: boolean
  templeGroupId: string | null
  phoneNumber: string | null
  createdAt: string
}
