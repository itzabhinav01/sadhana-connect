import { useState } from 'react'

import {
  templeGroupNameSchema,
  useAdminTempleGroups,
  useCreateTempleGroup,
  useDeleteTempleGroup,
  useRenameTempleGroup,
} from '@sadhana-connect/admin'
import type { TempleGroup } from '@sadhana-connect/domain'
import { formatDateLong } from '@sadhana-connect/shared'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

function formatDate(iso: string) {
  return formatDateLong(new Date(iso))
}

export function AdminTempleGroupsPage() {
  const groupsQuery = useAdminTempleGroups()
  const createGroup = useCreateTempleGroup()
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  function handleCreate() {
    const result = templeGroupNameSchema.safeParse({ name: newName })
    if (!result.success) {
      setCreateError(result.error.issues[0]?.message ?? 'Invalid name.')
      return
    }
    setCreateError(null)
    createGroup.mutate(result.data.name, { onSuccess: () => setNewName('') })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Temple Groups</h1>
        <p className="text-muted-foreground">Create, rename, and manage temple groups.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium text-foreground">New temple group</h2>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Group name…"
          />
          <Button type="button" onClick={handleCreate} disabled={createGroup.isPending}>
            {createGroup.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
        {createError ? <p className="text-xs text-destructive">{createError}</p> : null}
        {createGroup.isError ? (
          <p className="text-xs text-destructive">Something went wrong creating this group.</p>
        ) : null}
      </div>

      {groupsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {groupsQuery.isError ? (
        <p className="text-sm text-destructive">Something went wrong loading temple groups.</p>
      ) : null}
      {groupsQuery.isSuccess && groupsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No temple groups yet.</p>
      ) : null}

      {groupsQuery.data && groupsQuery.data.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border rounded-lg border">
          {groupsQuery.data.map((group) => (
            <li key={group.id}>
              <TempleGroupRow group={group} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function TempleGroupRow({ group }: { group: TempleGroup }) {
  const renameGroup = useRenameTempleGroup()
  const deleteGroup = useDeleteTempleGroup()
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(group.name)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleSave() {
    const result = templeGroupNameSchema.safeParse({ name: draftName })
    if (!result.success) {
      setRenameError(result.error.issues[0]?.message ?? 'Invalid name.')
      return
    }
    setRenameError(null)
    renameGroup.mutate(
      { id: group.id, name: result.data.name },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      {isEditing ? (
        <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
          {renameError ? <p className="text-xs text-destructive">{renameError}</p> : null}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={renameGroup.isPending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setDraftName(group.name)
                setRenameError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-medium text-foreground">{group.name}</p>
          <p className="text-xs text-muted-foreground">Created {formatDate(group.createdAt)}</p>
        </div>
      )}

      {!isEditing ? (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            Rename
          </Button>
          {confirmingDelete ? (
            <>
              <span className="text-xs text-muted-foreground">Delete?</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => deleteGroup.mutate(group.id)}
                disabled={deleteGroup.isPending}
              >
                Confirm
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      ) : null}
      {deleteGroup.isError ? (
        <p className="text-xs text-destructive">
          This group is still in use and can&apos;t be deleted.
        </p>
      ) : null}
    </div>
  )
}
