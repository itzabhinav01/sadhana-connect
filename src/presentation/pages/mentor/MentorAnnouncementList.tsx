import { useState } from 'react'

import { announcementSchema } from '@/application/announcements/announcement-schema'
import { useAuth } from '@/application/auth/use-auth'
import { useDeleteAnnouncement } from '@/application/announcements/use-delete-announcement'
import { useUpdateAnnouncement } from '@/application/announcements/use-update-announcement'
import type { Announcement } from '@/domain/entities/announcement'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

interface MentorAnnouncementListProps {
  announcements: Announcement[]
}

export function MentorAnnouncementList({ announcements }: MentorAnnouncementListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {announcements.map((announcement) => (
        <li key={announcement.id}>
          <MentorAnnouncementItem announcement={announcement} />
        </li>
      ))}
    </ul>
  )
}

interface MentorAnnouncementItemProps {
  announcement: Announcement
}

function MentorAnnouncementItem({ announcement }: MentorAnnouncementItemProps) {
  const { session } = useAuth()
  const currentUserId = session?.userId ?? null
  // UI convenience only, matching the mentor-comment pattern — RLS
  // (announcements_update/_delete, own-row only) is what actually
  // enforces this regardless of what this component shows.
  const isOwn = announcement.authorId === currentUserId

  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draftTitle, setDraftTitle] = useState(announcement.title)
  const [draftContent, setDraftContent] = useState(announcement.content)
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  function handleSave() {
    const result = announcementSchema.safeParse({ title: draftTitle, content: draftContent })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Invalid announcement.')
      return
    }
    setValidationError(null)
    updateAnnouncement.mutate(
      {
        id: announcement.id,
        title: result.data.title,
        content: result.data.content,
        isPublished: announcement.isPublished,
      },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setDraftTitle(announcement.title)
    setDraftContent(announcement.content)
    setValidationError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="flex items-center gap-2">
            {isEditing ? 'Editing Announcement' : announcement.title}
            {!announcement.isPublished ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Draft
              </span>
            ) : null}
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
            {validationError ? (
              <p className="text-xs text-destructive">{validationError}</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleSave} disabled={updateAnnouncement.isPending}>
                Save
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
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
          </>
        )}

        {isOwn && !isEditing ? (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            {confirmingDelete ? (
              <>
                <span className="text-xs text-muted-foreground">Delete this announcement?</span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteAnnouncement.mutate(announcement.id)}
                  disabled={deleteAnnouncement.isPending}
                >
                  Confirm
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
