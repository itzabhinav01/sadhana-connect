import type { AppRole } from '@/domain/entities/profile'
import type { AdminUser } from '@/domain/entities/admin-user'

export interface AdminUserFilters {
  search?: string
  role?: AppRole
  status?: 'active' | 'disabled' | 'anonymized'
}

export interface AdminUserListPage {
  users: AdminUser[]
  nextCursor: string | null
}

export interface AdminUserListParams extends AdminUserFilters {
  limit: number
  cursor: string | null
}

export interface AdminUserRepository {
  // RLS (profiles_select, is_super_admin() branch) is the real
  // authorization boundary — no viewer parameter needed, same reasoning as
  // AnnouncementRepository.listVisibleAnnouncements.
  listUsers(params: AdminUserListParams): Promise<AdminUserListPage>

  getUserById(id: string): Promise<AdminUser | null>

  // devotee <-> mentor only — super_admin is never a valid value here.
  // Enforced by the type itself; RLS + protect_profile_restricted_columns
  // is what actually enforces "super admin only" server-side regardless.
  changeUserRole(id: string, role: Extract<AppRole, 'devotee' | 'mentor'>): Promise<void>

  setUserActive(id: string, isActive: boolean): Promise<void>

  // The DB-side half of the approved split anonymize/delete workflow:
  // profiles.is_active=false, full_name='Deleted User', anonymized_at=now(),
  // and deactivation of every active mentor_assignments row involving this
  // profile (either side). Does NOT touch Supabase Auth — that's the
  // separate, Edge-Function-only ban step performed by the application use
  // case that calls this.
  anonymizeUser(id: string): Promise<void>
}
