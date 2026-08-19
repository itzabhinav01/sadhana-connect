import { useState } from 'react'

import {
  useDeleteAndAnonymizeUser,
  useRetryBan,
} from '@/application/admin/use-delete-and-anonymize-user'
import { useSetUserActive } from '@/application/admin/use-set-user-active'
import { deriveAdminUserStatus, type AdminUser } from '@/domain/entities/admin-user'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

interface AdminUserLifecycleControlsProps {
  user: AdminUser
}

export function AdminUserLifecycleControls({ user }: AdminUserLifecycleControlsProps) {
  const status = deriveAdminUserStatus(user.isActive, user.anonymizedAt)
  const setActive = useSetUserActive()
  const deleteAndAnonymize = useDeleteAndAnonymizeUser()
  const retryBan = useRetryBan()

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [partialFailure, setPartialFailure] = useState(false)

  if (status === 'anonymized') {
    // Intentionally durable — no Enable action is ever offered here,
    // matching the approved design. Login ban may still be pending after
    // a prior partial failure; offer only the retry.
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <span className="text-sm font-medium text-foreground">Account status</span>
        <p className="text-sm text-muted-foreground">
          This account has been deleted. Personal information has been anonymized and login is
          permanently disabled.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => retryBan.mutate(user.id)}
          disabled={retryBan.isPending}
          className="self-start"
        >
          {retryBan.isPending ? 'Retrying…' : 'Retry login ban'}
        </Button>
        {retryBan.isError ? (
          <p className="text-xs text-destructive">Retry failed. Please try again.</p>
        ) : null}
        {retryBan.isSuccess ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Login ban confirmed.</p>
        ) : null}
      </div>
    )
  }

  if (partialFailure) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-destructive/40 p-3">
        <span className="text-sm font-medium text-foreground">Account status</span>
        <p className="text-sm text-destructive">
          Profile anonymized. Login ban still pending — retry?
        </p>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() =>
            retryBan.mutate(user.id, { onSuccess: () => setPartialFailure(false) })
          }
          disabled={retryBan.isPending}
          className="self-start"
        >
          {retryBan.isPending ? 'Retrying…' : 'Retry ban'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">Account status</span>

      {status === 'active' ? (
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
              This will anonymize this account&apos;s personal information (name becomes
              &quot;Deleted User&quot;), permanently disable login, and deactivate any active
              mentor assignments. Historical Sadhana reports and assignment history are preserved.
              This action is intentionally durable and cannot be undone.
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
                disabled={confirmText !== user.fullName || deleteAndAnonymize.isPending}
                onClick={() =>
                  deleteAndAnonymize.mutate(user.id, {
                    onSuccess: (result) => {
                      if (result.stage === 'profile-anonymized') {
                        setPartialFailure(true)
                      }
                      setConfirmingDelete(false)
                      setConfirmText('')
                    },
                  })
                }
              >
                {deleteAndAnonymize.isPending ? 'Deleting…' : 'Confirm delete'}
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
          </div>
        )}
      </div>
    </div>
  )
}
