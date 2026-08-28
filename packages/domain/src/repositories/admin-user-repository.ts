import type { AppRole } from '../entities/profile'
import type { AdminUser } from '../entities/admin-user'

export interface AdminUserFilters {
  search?: string
  role?: AppRole
  // Phase 20C: 'anonymized' removed — see AdminUserStatus's own note.
  status?: 'active' | 'disabled'
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

  // Any AppRole, including super_admin (approved: promoting straight to
  // Super Admin is now offered in the Admin UI). RLS +
  // protect_profile_restricted_columns is what actually enforces "super
  // admin only" server-side regardless of what this layer allows.
  changeUserRole(id: string, role: AppRole): Promise<void>

  setUserActive(id: string, isActive: boolean): Promise<void>

  // null clears the assignment. RLS + protect_profile_restricted_columns
  // is what actually enforces "super admin only", same as changeUserRole.
  setUserTempleGroup(id: string, templeGroupId: string | null): Promise<void>

  // Phase 20C: the anonymize half of the old split delete workflow is
  // gone — deletion is now the trusted admin-account-actions Edge
  // Function's hard_delete action (see useHardDeleteUser), which
  // performs the real DELETE FROM profiles (service-role, bypassing
  // RLS — profiles has no client-facing DELETE policy) followed by
  // permanent Supabase Auth removal. Nothing in this repository
  // performs deletion.
}
