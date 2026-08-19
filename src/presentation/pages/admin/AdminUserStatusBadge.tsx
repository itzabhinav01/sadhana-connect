import { deriveAdminUserStatus } from '@/domain/entities/admin-user'

interface AdminUserStatusBadgeProps {
  isActive: boolean
  anonymizedAt: string | null
}

const STATUS_LABEL: Record<ReturnType<typeof deriveAdminUserStatus>, string> = {
  active: 'Active',
  disabled: 'Disabled',
  anonymized: 'Deleted',
}

const STATUS_CLASSNAME: Record<ReturnType<typeof deriveAdminUserStatus>, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  disabled: 'bg-muted text-muted-foreground',
  anonymized: 'bg-destructive/15 text-destructive',
}

// Status is always derived from is_active + anonymized_at (never from
// full_name) — see domain/entities/admin-user.ts.
export function AdminUserStatusBadge({ isActive, anonymizedAt }: AdminUserStatusBadgeProps) {
  const status = deriveAdminUserStatus(isActive, anonymizedAt)

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSNAME[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
