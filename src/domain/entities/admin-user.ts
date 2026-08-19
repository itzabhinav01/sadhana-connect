import type { AppRole } from '@/domain/entities/profile'

// Derived entirely from profiles.is_active + profiles.anonymized_at
// (migration 0005) — never inferred from full_name. See
// protect_profile_restricted_columns() for the column-level guard and
// profiles_anonymized_requires_inactive for the DB-enforced invariant that
// makes 'anonymized' and 'active' mutually exclusive.
export type AdminUserStatus = 'active' | 'disabled' | 'anonymized'

export function deriveAdminUserStatus(
  isActive: boolean,
  anonymizedAt: string | null,
): AdminUserStatus {
  if (isActive) return 'active'
  return anonymizedAt !== null ? 'anonymized' : 'disabled'
}

export interface AdminUser {
  id: string
  fullName: string
  role: AppRole
  isActive: boolean
  anonymizedAt: string | null
  templeGroupId: string | null
  createdAt: string
}
