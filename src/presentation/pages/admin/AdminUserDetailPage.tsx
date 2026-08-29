import { useNavigate, useParams } from 'react-router-dom'

import {
  useAdminAssignments,
  useAdminUserDetail,
  useDeactivateAssignment,
  useMentorDevoteeCount,
} from '@sadhana-connect/admin'
import { formatDateLong } from '@sadhana-connect/shared'
import { Button } from '@/presentation/components/ui/button'
import { DevoteeSadhanaHistorySection } from '@/presentation/components/shared/DevoteeSadhanaHistorySection'
import { AdminUserEmailReveal } from '@/presentation/pages/admin/AdminUserEmailReveal'
import { AdminUserLifecycleControls } from '@/presentation/pages/admin/AdminUserLifecycleControls'
import { AdminUserPasswordReset } from '@/presentation/pages/admin/AdminUserPasswordReset'
import { AdminUserRoleControl } from '@/presentation/pages/admin/AdminUserRoleControl'
import { AdminUserStatusBadge } from '@/presentation/pages/admin/AdminUserStatusBadge'

function formatDate(iso: string) {
  return formatDateLong(new Date(iso))
}

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
          <AdminUserStatusBadge isActive={user.isActive} />
        </div>
        <p className="text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-md border p-3">
        <span className="text-sm font-medium text-foreground">Email</span>
        <AdminUserEmailReveal targetUserId={user.id} />
      </div>

      <div className="rounded-md border p-3">
        <span className="text-sm font-medium text-foreground">Phone number</span>
        <p className="text-sm text-muted-foreground">{user.phoneNumber ?? 'Not provided'}</p>
      </div>

      {user.role === 'mentor' ? <MentorInfoPanel mentorId={user.id} /> : null}
      {user.role === 'devotee' ? <DevoteeInfoPanel devoteeId={user.id} /> : null}

      {/* Phase 20C: there is no durable "anonymized" state to guard
          against anymore — a deleted account is a genuinely deleted row,
          not a row you could navigate back to. The only remaining guard
          is the existing super_admin exclusion. */}
      {user.role !== 'super_admin' ? <AdminUserRoleControl user={user} /> : null}

      <AdminUserLifecycleControls user={user} onDeleted={() => navigate('/admin/users')} />

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

// A devotee may have up to 3 active mentors at once (approved cap,
// 0015) — this lists every one of them with its own Remove action,
// rather than assuming a single "the" mentor. Adding a mentor happens
// on the Assignments page (AdminAssignmentForm), which already searches
// across every devotee/mentor, not just this one.
function DevoteeInfoPanel({ devoteeId }: { devoteeId: string }) {
  const assignmentsQuery = useAdminAssignments({ devoteeId })
  const activeAssignments = assignmentsQuery.data?.filter((assignment) => assignment.isActive) ?? []
  const deactivate = useDeactivateAssignment()

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border p-3">
        <span className="text-sm font-medium text-foreground">Current mentors</span>
        {assignmentsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : activeAssignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mentor assigned</p>
        ) : (
          <ul className="flex flex-col gap-2 pt-1">
            {activeAssignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
              >
                <span>{assignment.mentorName}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => deactivate.mutate(assignment.id)}
                  disabled={deactivate.isPending}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DevoteeSadhanaHistorySection devoteeId={devoteeId} />
    </div>
  )
}
