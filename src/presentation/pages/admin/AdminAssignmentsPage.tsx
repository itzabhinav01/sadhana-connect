import { useAdminAssignments } from '@/application/admin/use-admin-assignments'
import { AdminAssignmentForm } from '@/presentation/pages/admin/AdminAssignmentForm'
import { AdminAssignmentList } from '@/presentation/pages/admin/AdminAssignmentList'

export function AdminAssignmentsPage() {
  const assignmentsQuery = useAdminAssignments()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mentor Assignments</h1>
        <p className="text-muted-foreground">Assign, reassign, and review assignment history.</p>
      </div>

      <AdminAssignmentForm />

      {assignmentsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {assignmentsQuery.isError ? (
        <p className="text-sm text-destructive">Something went wrong loading assignments.</p>
      ) : null}

      {assignmentsQuery.data ? <AdminAssignmentList assignments={assignmentsQuery.data} /> : null}
    </div>
  )
}
