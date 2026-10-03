import { Search } from 'lucide-react'
import { useState } from 'react'

import { useDeactivateAssignment } from '@sadhana-connect/admin'
import type { AdminMentorAssignment } from '@sadhana-connect/domain'
import { formatDateLong } from '@sadhana-connect/shared'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

function formatDate(iso: string) {
  return formatDateLong(new Date(iso))
}

type AssignmentFilter = 'all' | 'active' | 'inactive'

interface AdminAssignmentListProps {
  assignments: AdminMentorAssignment[]
}

// Full history, active and inactive — no DELETE policy exists on
// mentor_assignments (append-only by design), so nothing here ever
// removes a row, only deactivates the active one.
export function AdminAssignmentList({ assignments }: AdminAssignmentListProps) {
  const deactivate = useDeactivateAssignment()
  const [statusFilter, setStatusFilter] = useState<AssignmentFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">No assignments yet.</p>
  }

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const visibleAssignments = assignments.filter((assignment) => {
    if (statusFilter === 'active' && !assignment.isActive) return false
    if (statusFilter === 'inactive' && assignment.isActive) return false
    if (!normalizedSearch) return true
    return (
      assignment.mentorName.toLowerCase().includes(normalizedSearch) ||
      assignment.devoteeName.toLowerCase().includes(normalizedSearch)
    )
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'inactive'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={statusFilter === option ? 'default' : 'outline'}
              onClick={() => setStatusFilter(option)}
              className="capitalize"
            >
              {option === 'all' ? 'All' : option === 'active' ? 'Active' : 'Inactive'}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by mentor or devotee…"
            aria-label="Search assignments"
            className="pl-9"
          />
        </div>
      </div>

      {visibleAssignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assignments match this filter.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border">
          {visibleAssignments.map((assignment) => (
            <li key={assignment.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="self-start sm:self-auto"
                >
                  Deactivate
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Inactive</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
