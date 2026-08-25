import { Link } from 'react-router-dom'

import { useAnnouncements } from '@sadhana-connect/announcements'
import type { Announcement } from '@sadhana-connect/domain'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

// Devotee-facing community feed (section 7). Reuses useAnnouncements()
// as-is — announcements_select already returns exactly what this viewer
// may see (published, scope-matched, not expired), and
// announcements_feed_ordering_idx (0011) already orders the result
// pinned-first, then newest published_at first, so this component adds
// no client-side filtering or sorting of its own. No search/filter UI —
// deliberately out of scope (section 17).
export function AnnouncementsFeedPage() {
  const announcementsQuery = useAnnouncements()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="text-muted-foreground">Community updates from your temple and mentors.</p>
      </div>

      {announcementsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {announcementsQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading announcements.
        </p>
      ) : null}

      {announcementsQuery.isSuccess && announcementsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : null}

      {announcementsQuery.isSuccess && announcementsQuery.data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {announcementsQuery.data.map((announcement) => (
            <li key={announcement.id}>
              <AnnouncementFeedCard announcement={announcement} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function AnnouncementFeedCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link to={`/announcements/${announcement.id}`} className="flex flex-wrap items-center gap-2 hover:underline">
            <h2>{announcement.title}</h2>
            {announcement.isPinned ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Pinned
              </span>
            ) : null}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
          {announcement.content}
        </p>
        <p className="text-xs text-muted-foreground">
          {announcement.publishedAt
            ? `Published ${formatDisplayDate(announcement.publishedAt)}`
            : `Created ${formatDisplayDate(announcement.createdAt)}`}
        </p>
      </CardContent>
    </Card>
  )
}
