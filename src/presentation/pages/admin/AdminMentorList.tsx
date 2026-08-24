import { Link } from 'react-router-dom'

import type { AdminUser } from '@sadhana-connect/domain/entities/admin-user'
import type { MentorDevoteeCount } from '@sadhana-connect/domain/repositories/admin-assignment-repository'
import { AdminUserStatusBadge } from '@/presentation/pages/admin/AdminUserStatusBadge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

interface AdminMentorListProps {
  mentors: AdminUser[]
  counts: MentorDevoteeCount[]
}

export function AdminMentorList({ mentors, counts }: AdminMentorListProps) {
  const countByMentorId = new Map(counts.map((c) => [c.mentorId, c.activeDevoteeCount]))

  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border">
      {mentors.map((mentor) => (
        <li key={mentor.id}>
          <Link
            to={`/admin/users/${mentor.id}`}
            className="flex flex-col gap-1 p-4 hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{mentor.fullName}</span>
              <AdminUserStatusBadge isActive={mentor.isActive} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{countByMentorId.get(mentor.id) ?? 0} active devotees</span>
              <span>Joined {formatDate(mentor.createdAt)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
