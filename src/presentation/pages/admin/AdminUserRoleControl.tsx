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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'

interface AdminUserRoleControlProps {
  user: AdminUser
}

// A Super Admin may promote a Devotee/Mentor straight to Super Admin
// from here (approved). Note this control only ever renders for a
// devotee/mentor target in the first place — AdminUserDetailPage hides
// it entirely once a user already IS super_admin, so demoting an
// existing Super Admin is still never offered through this control.
const SELECTABLE_ROLES: AppRole[] = ['devotee', 'mentor', 'super_admin']

const ROLE_LABEL: Record<AppRole, string> = {
  devotee: 'Devotee',
  mentor: 'Mentor',
  super_admin: 'Super Admin',
}

export function AdminUserRoleControl({ user }: AdminUserRoleControlProps) {
  // super_admin accounts never get this control at all — the detail page
  // only renders it for devotee/mentor users.
  const [selectedRole, setSelectedRole] = useState<AppRole>(
    user.role === 'mentor' ? 'mentor' : 'devotee',
  )
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  // Presentation-time gate: disable any transition AWAY from Mentor
  // (to Devotee or straight to Super Admin) when this mentor currently
  // has active devotees — both destinations leave the same orphaned
  // mentor_assignments risk. Devotee -> anything is never gated (fetch
  // is skipped entirely when the user is already a mentor, since the
  // count doesn't apply to that direction).
  const mentorDevoteeCount = useMentorDevoteeCount(user.role === 'mentor' ? user.id : null)
  const changeRole = useChangeUserRole()

  const wouldLeaveMentorRole = user.role === 'mentor' && selectedRole !== 'mentor'
  const hasActiveDevotees = (mentorDevoteeCount.data ?? 0) > 0
  const demoteBlockedByActiveDevotees = wouldLeaveMentorRole && hasActiveDevotees

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
          onValueChange={(value) => {
            setBlockedMessage(null)
            setSelectedRole(value as AppRole)
          }}
        >
          <SelectTrigger aria-label="Change role" className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SELECTABLE_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABEL[role]}
              </SelectItem>
            ))}
          </SelectContent>
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
