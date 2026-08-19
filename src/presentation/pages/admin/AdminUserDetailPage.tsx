import { useParams } from 'react-router-dom'

import { useAdminAssignments } from '@/application/admin/use-admin-assignments'
import { useAdminUserDetail } from '@/application/admin/use-admin-user-detail'
import { useMentorDevoteeCount } from '@/application/admin/use-mentor-devotee-count'
import { deriveAdminUserStatus } from '@/domain/entities/admin-user'
import { AdminUserEmailReveal } from '@/presentation/pages/admin/AdminUserEmailReveal'
import { AdminUserLifecycleControls } from '@/presentation/pages/admin/AdminUserLifecycleControls'
import { AdminUserPasswordReset } from '@/presentation/pages/admin/AdminUserPasswordReset'
import { AdminUserRoleControl } from '@/presentation/pages/admin/AdminUserRoleControl'
import { AdminUserStatusBadge } from '@/presentation/pages/admin/AdminUserStatusBadge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userQuery = useAdminUserDetail(id ?? '')

  if (userQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (userQuery.isError || !userQuery.data) {
    return <p className="text-sm text-destructive">This user isn&apos;t available.</p>
  }

  const user = userQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{user.fullName}</h1>
          <AdminUserStatusBadge isActive={user.isActive} anonymizedAt={user.anonymizedAt} />
        </div>
        <p className="text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-md border p-3">
        <span className="text-sm font-medium text-foreground">Email</span>
        <AdminUserEmailReveal targetUserId={user.id} />
      </div>

      {user.role === 'mentor' ? <MentorInfoPanel mentorId={user.id} /> : null}
      {user.role === 'devotee' ? <DevoteeInfoPanel devoteeId={user.id} /> : null}

      {/* Anonymized/deleted accounts never get a role control — status
          (shown above via AdminUserStatusBadge as "Deleted") is the only
          thing shown in its place. This is a durable terminal state; role
          mutation on it is never offered, matching the same reasoning as
          AdminUserLifecycleControls never offering "Enable" here. RLS/the
          protect_profile_restricted_columns trigger are unchanged — this
          is a presentation-layer guard only. */}
      {user.role !== 'super_admin' &&
      deriveAdminUserStatus(user.isActive, user.anonymizedAt) !== 'anonymized' ? (
        <AdminUserRoleControl user={user} />
      ) : null}

      <AdminUserLifecycleControls user={user} />

      <AdminUserPasswordReset targetUserId={user.id} />
    </div>
  )
}

function MentorInfoPanel({ mentorId }: { mentorId: string }) {
  const countQuery = useMentorDevoteeCount(mentorId)

  return (
    <div className="rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">Assigned devotees</span>
      <p className="text-sm text-muted-foreground">
        {countQuery.isPending ? 'Loading…' : (countQuery.data ?? 0)}
      </p>
    </div>
  )
}

function DevoteeInfoPanel({ devoteeId }: { devoteeId: string }) {
  const assignmentsQuery = useAdminAssignments({ devoteeId })
  const activeAssignment = assignmentsQuery.data?.find((assignment) => assignment.isActive)

  return (
    <div className="rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">Current mentor</span>
      <p className="text-sm text-muted-foreground">
        {assignmentsQuery.isPending
          ? 'Loading…'
          : (activeAssignment?.mentorName ?? 'No mentor assigned')}
      </p>
    </div>
  )
}
