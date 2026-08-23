import { Link } from 'react-router-dom'

import type { AdminUser } from '@/domain/entities/admin-user'
import { AdminUserStatusBadge } from '@/presentation/pages/admin/AdminUserStatusBadge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

interface AdminUserListProps {
  users: AdminUser[]
}

export function AdminUserList({ users }: AdminUserListProps) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            to={`/admin/users/${user.id}`}
            className="flex flex-col gap-1 p-4 hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{user.fullName}</span>
              <AdminUserStatusBadge isActive={user.isActive} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="capitalize">{user.role.replace('_', ' ')}</span>
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
