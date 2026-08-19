import { useDeactivateAssignment } from '@/application/admin/use-deactivate-assignment'
import type { AdminMentorAssignment } from '@/domain/entities/mentor-assignment'
import { Button } from '@/presentation/components/ui/button'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

interface AdminAssignmentListProps {
  assignments: AdminMentorAssignment[]
}

// Full history, active and inactive — no DELETE policy exists on
// mentor_assignments (append-only by design), so nothing here ever
// removes a row, only deactivates the active one.
export function AdminAssignmentList({ assignments }: AdminAssignmentListProps) {
  const deactivate = useDeactivateAssignment()

  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">No assignments yet.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-foreground">
              <span className="font-medium">{assignment.mentorName}</span> mentors{' '}
              <span className="font-medium">{assignment.devoteeName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Assigned {formatDate(assignment.assignedAt)}
              {assignment.unassignedAt ? ` · Ended ${formatDate(assignment.unassignedAt)}` : ''}
            </p>
          </div>
          {assignment.isActive ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => deactivate.mutate(assignment.id)}
              disabled={deactivate.isPending}
            >
              Deactivate
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Inactive</span>
          )}
        </li>
      ))}
    </ul>
  )
}
