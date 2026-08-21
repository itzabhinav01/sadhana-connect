import { useParams } from 'react-router-dom'

import { useAnnouncements } from '@/application/announcements/use-announcements'

// Minimal devotee-facing announcement view — no such page existed before
// Phase 17; this exists only so an 'announcement' notification's deep
// link has somewhere to go. Reuses the existing viewer-scoped
// useAnnouncements() query as-is: announcements_select (0001) already
// returns exactly what this viewer is allowed to read, so no new
// repository method or RLS is introduced here.
export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const announcementsQuery = useAnnouncements()
  const announcement = announcementsQuery.data?.find((item) => item.id === id)

  return (
    <div className="flex flex-col gap-6">
      {announcementsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {announcementsQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading this announcement. Please try again.
        </p>
      ) : null}

      {announcementsQuery.isSuccess && !announcement ? (
        <p className="text-sm text-muted-foreground">
          This announcement is not available.
        </p>
      ) : null}

      {announcement ? (
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            {announcement.title}
          </h1>
          <p className="whitespace-pre-wrap text-foreground">
            {announcement.content}
          </p>
        </div>
      ) : null}
    </div>
  )
}
