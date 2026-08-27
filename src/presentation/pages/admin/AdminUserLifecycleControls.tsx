import { useState } from 'react'

import { useHardDeleteUser } from '@/application/admin/use-hard-delete-user'
import { useSetUserActive } from '@sadhana-connect/admin'
import type { AdminUser } from '@sadhana-connect/domain'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

interface AdminUserLifecycleControlsProps {
  user: AdminUser
  // Called once hard delete succeeds (in either terminal stage — see
  // useHardDeleteUser's own doc comment) — the profile this page was
  // showing no longer exists, so the caller navigates away rather than
  // this component trying to render a now-nonexistent user.
  onDeleted: () => void
}

// Phase 20C: the durable "anonymized" status branch and the two-stage
// profile-anonymized/retry-ban UI are both gone — deletion is now a
// single trusted hard_delete call (see useHardDeleteUser) with no
// intermediate row-still-exists state to render.
export function AdminUserLifecycleControls({ user, onDeleted }: AdminUserLifecycleControlsProps) {
  const setActive = useSetUserActive()
  const hardDelete = useHardDeleteUser()

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">Account status</span>

      {user.isActive ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setActive.mutate({ userId: user.id, isActive: false })}
          disabled={setActive.isPending}
          className="self-start"
        >
          Disable account
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setActive.mutate({ userId: user.id, isActive: true })}
          disabled={setActive.isPending}
          className="self-start"
        >
          Re-enable account
        </Button>
      )}

      <div className="mt-2 border-t pt-3">
        {!confirmingDelete ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete account
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground">
              This will <span className="font-semibold">permanently delete</span> this account:
              their profile, every Sadhana report, every mentor-assignment record (on either
              side), and every comment they authored are all removed from the database, along
              with their login. This action is irreversible and cannot be undone.
            </p>
            <label htmlFor="delete-confirm-name" className="text-sm text-foreground">
              Type <span className="font-semibold">{user.fullName}</span> to confirm.
            </label>
            <Input
              id="delete-confirm-name"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={confirmText !== user.fullName || hardDelete.isPending}
                onClick={() =>
                  hardDelete.mutate(user.id, {
                    onSuccess: () => onDeleted(),
                  })
                }
              >
                {hardDelete.isPending ? 'Deleting…' : 'Confirm delete'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setConfirmingDelete(false)
                  setConfirmText('')
                }}
              >
                Cancel
              </Button>
            </div>
            {hardDelete.isError ? (
              <p className="text-xs text-destructive">
                Something went wrong deleting this account. Please try again.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
