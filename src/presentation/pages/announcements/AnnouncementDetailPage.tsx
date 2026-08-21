import { useParams } from 'react-router-dom'

import { useAnnouncements } from '@/application/announcements/use-announcements'
import { AnnouncementComments } from '@/presentation/pages/announcements/AnnouncementComments'

// Devotee-facing announcement view — originally added in Phase 17 so an
// 'announcement' notification's deep link had somewhere to go, now also
// the /announcements feed's click-through target and the Q&A surface
// (Phase 20A). Reuses the existing viewer-scoped useAnnouncements() query
// as-is: announcements_select already returns exactly what this viewer
// is allowed to read (including the Phase 20A expiry guard), so no new
// repository method or RLS is introduced here.
//
// A missing `announcement` covers three distinct cases identically on
// purpose (deleted, expired-and-purged, or never-visible-to-this-viewer)
// — section 11's approved requirement is a single generic message that
// reveals none of those reasons.
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
          This announcement is no longer available.
        </p>
      ) : null}

      {announcement ? (
        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              {announcement.title}
            </h1>
            <p className="whitespace-pre-wrap text-foreground">
              {announcement.content}
            </p>
          </div>

          <AnnouncementComments
            announcementId={announcement.id}
            announcementAuthorId={announcement.authorId}
          />
        </div>
      ) : null}
    </div>
  )
}
