import { useState } from 'react'

import {
  MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE,
  MentorHasActiveDevoteesError,
  useChangeUserRole,
} from '@/application/admin/use-change-user-role'
import { useMentorDevoteeCount } from '@/application/admin/use-mentor-devotee-count'
import type { AdminUser } from '@/domain/entities/admin-user'
import type { AppRole } from '@/domain/entities/profile'
import { Button } from '@/presentation/components/ui/button'
import { Select } from '@/presentation/components/ui/select'

interface AdminUserRoleControlProps {
  user: AdminUser
}

// super_admin is never a selectable value here — the option simply does
// not exist in this control, matching the approved design. Devotee <->
// Mentor only.
const SELECTABLE_ROLES: Extract<AppRole, 'devotee' | 'mentor'>[] = ['devotee', 'mentor']

export function AdminUserRoleControl({ user }: AdminUserRoleControlProps) {
  // super_admin accounts never get this control at all — the detail page
  // only renders it for devotee/mentor users.
  const [selectedRole, setSelectedRole] = useState<Extract<AppRole, 'devotee' | 'mentor'>>(
    user.role === 'mentor' ? 'mentor' : 'devotee',
  )
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  // Presentation-time gate: disable the Mentor -> Devotee transition
  // outright when this mentor currently has active devotees. Devotee ->
  // Mentor is never gated (fetch is skipped entirely when the user is
  // already a mentor, since the count doesn't apply to that direction).
  const mentorDevoteeCount = useMentorDevoteeCount(user.role === 'mentor' ? user.id : null)
  const changeRole = useChangeUserRole()

  const wouldDemoteMentor = user.role === 'mentor' && selectedRole === 'devotee'
  const hasActiveDevotees = (mentorDevoteeCount.data ?? 0) > 0
  const demoteBlockedByActiveDevotees = wouldDemoteMentor && hasActiveDevotees

  function handleSubmit() {
    setBlockedMessage(null)
    changeRole.mutate(
      { userId: user.id, currentRole: user.role, newRole: selectedRole },
      {
        onError: (error) => {
          if (error instanceof MentorHasActiveDevoteesError) {
            setBlockedMessage(error.message)
          }
        },
      },
    )
  }

  const noChange = selectedRole === user.role

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">Role</span>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={selectedRole}
          onChange={(event) => {
            setBlockedMessage(null)
            setSelectedRole(event.target.value as Extract<AppRole, 'devotee' | 'mentor'>)
          }}
          aria-label="Change role"
          className="w-auto"
        >
          {SELECTABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {role === 'devotee' ? 'Devotee' : 'Mentor'}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={noChange || demoteBlockedByActiveDevotees || changeRole.isPending}
        >
          {changeRole.isPending ? 'Saving…' : 'Save role'}
        </Button>
      </div>

      {demoteBlockedByActiveDevotees ? (
        <p className="text-xs text-destructive">{MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE}</p>
      ) : null}

      {blockedMessage ? <p className="text-xs text-destructive">{blockedMessage}</p> : null}

      {changeRole.isError && !blockedMessage ? (
        <p className="text-xs text-destructive">Something went wrong changing this role.</p>
      ) : null}
    </div>
  )
}
