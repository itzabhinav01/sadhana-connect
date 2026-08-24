import { deriveAdminUserStatus } from '@sadhana-connect/domain/entities/admin-user'

interface AdminUserStatusBadgeProps {
  isActive: boolean
}

const STATUS_LABEL: Record<ReturnType<typeof deriveAdminUserStatus>, string> = {
  active: 'Active',
  disabled: 'Disabled',
}

const STATUS_CLASSNAME: Record<ReturnType<typeof deriveAdminUserStatus>, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  disabled: 'bg-muted text-muted-foreground',
}

// Status is always derived from is_active (never from full_name) — see
// domain/entities/admin-user.ts. There is no 'anonymized' state anymore
// (Phase 20C): a deleted account no longer exists as a row at all.
export function AdminUserStatusBadge({ isActive }: AdminUserStatusBadgeProps) {
  const status = deriveAdminUserStatus(isActive)

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSNAME[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
