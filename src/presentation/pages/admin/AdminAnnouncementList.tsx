import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  ANNOUNCEMENT_EXPIRATION_PRESETS,
  ANNOUNCEMENT_EXPIRATION_PRESET_LABELS,
  resolveExpirationError,
  resolveExpiresAt,
  toExpirationFormValue,
  type AnnouncementExpirationPreset,
} from '@/application/announcements/announcement-expiration'
import { announcementSchema } from '@/application/announcements/announcement-schema'
import { useDeleteAnnouncement } from '@/application/announcements/use-delete-announcement'
import { useUpdateAnnouncement } from '@/application/announcements/use-update-announcement'
import type { Announcement } from '@/domain/entities/announcement'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Textarea } from '@/presentation/components/ui/textarea'

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

const SCOPE_LABEL: Record<Announcement['scope'], string> = {
  all: 'Everyone',
  mentors: 'Mentors',
  devotees: 'Devotees',
  temple_group: 'Temple group',
}

interface AdminAnnouncementListProps {
  announcements: Announcement[]
}

// Every row gets Edit/Delete regardless of author — announcements_update/
// _delete RLS already allows a super admin to act on any row (is_super_admin()
// branch), so there is no "own row" restriction to mirror in this UI, unlike
// MentorAnnouncementList.
export function AdminAnnouncementList({ announcements }: AdminAnnouncementListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {announcements.map((announcement) => (
        <li key={announcement.id}>
          <AdminAnnouncementItem announcement={announcement} />
        </li>
      ))}
    </ul>
  )
}

function AdminAnnouncementItem({ announcement }: { announcement: Announcement }) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draftTitle, setDraftTitle] = useState(announcement.title)
  const [draftContent, setDraftContent] = useState(announcement.content)
  const initialExpiration = toExpirationFormValue(announcement.expiresAt)
  const [expirationPreset, setExpirationPreset] = useState<AnnouncementExpirationPreset>(
    initialExpiration.preset,
  )
  const [customExpiresAt, setCustomExpiresAt] = useState(initialExpiration.customDateIso ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  function handleSave() {
    const result = announcementSchema.safeParse({ title: draftTitle, content: draftContent })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Invalid announcement.')
      return
    }
    const expirationErr = resolveExpirationError(expirationPreset, customExpiresAt || null)
    if (expirationErr) {
      setValidationError(expirationErr)
      return
    }
    setValidationError(null)
    updateAnnouncement.mutate(
      {
        id: announcement.id,
        title: result.data.title,
        content: result.data.content,
        isPublished: announcement.isPublished,
        expiresAt: resolveExpiresAt(expirationPreset, customExpiresAt || null),
        isPinned: announcement.isPinned,
      },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  function handleTogglePublish() {
    updateAnnouncement.mutate({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPublished: !announcement.isPublished,
      expiresAt: announcement.expiresAt,
      isPinned: announcement.isPinned,
    })
  }

  function handleTogglePin() {
    updateAnnouncement.mutate({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPublished: announcement.isPublished,
      expiresAt: announcement.expiresAt,
      isPinned: !announcement.isPinned,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="flex flex-wrap items-center gap-2">
            {isEditing ? 'Editing Announcement' : announcement.title}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {SCOPE_LABEL[announcement.scope]}
            </span>
            {announcement.isPinned ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Pinned
              </span>
            ) : null}
            {!announcement.isPublished ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Draft
              </span>
            ) : null}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {announcement.expiresAt
                ? `Expires ${formatDisplayDate(announcement.expiresAt)}`
                : 'Permanent'}
            </span>
          </h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              aria-label="Edit title"
            />
            <Textarea
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              rows={4}
              aria-label="Edit content"
            />
            <Select
              value={expirationPreset}
              onValueChange={(value) =>
                setExpirationPreset(value as AnnouncementExpirationPreset)
              }
            >
              <SelectTrigger aria-label="Edit expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOUNCEMENT_EXPIRATION_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {ANNOUNCEMENT_EXPIRATION_PRESET_LABELS[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {expirationPreset === 'custom' ? (
              <Input
                type="date"
                aria-label="Edit expiration date"
                value={customExpiresAt.slice(0, 10)}
                onChange={(event) =>
                  setCustomExpiresAt(
                    event.target.value ? new Date(event.target.value).toISOString() : '',
                  )
                }
              />
            ) : null}
            {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleSave} disabled={updateAnnouncement.isPending}>
                Save
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm text-foreground">{announcement.content}</p>
            <p className="text-xs text-muted-foreground">
              {announcement.publishedAt
                ? `Published ${formatDisplayDate(announcement.publishedAt)}`
                : `Created ${formatDisplayDate(announcement.createdAt)}`}
            </p>
            <Link
              to={`/announcements/${announcement.id}`}
              className="self-start text-xs font-medium text-primary hover:underline"
            >
              View comments
            </Link>
          </>
        )}

        {!isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleTogglePublish}
              disabled={updateAnnouncement.isPending}
            >
              {announcement.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleTogglePin}
              disabled={updateAnnouncement.isPending}
            >
              {announcement.isPinned ? 'Unpin' : 'Pin'}
            </Button>
            {confirmingDelete ? (
              <>
                <span className="text-xs text-muted-foreground">
                  Deleting removes this announcement for devotees. This cannot be undone.
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteAnnouncement.mutate(announcement.id)}
                  disabled={deleteAnnouncement.isPending}
                >
                  Confirm delete
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
