import { useAnnouncements } from '@/application/announcements/use-announcements'
import { AdminAnnouncementForm } from '@/presentation/pages/admin/AdminAnnouncementForm'
import { AdminAnnouncementList } from '@/presentation/pages/admin/AdminAnnouncementList'

// Reuses the existing announcements table/RLS entirely — no new table, no
// new policy. useAnnouncements() already returns every announcement for a
// super admin caller (announcements_select's is_super_admin() branch).
export function AdminAnnouncementsPage() {
  const announcementsQuery = useAnnouncements()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="text-muted-foreground">Create, edit, publish, and remove announcements.</p>
      </div>

      <AdminAnnouncementForm />

      {announcementsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {announcementsQuery.isError ? (
        <p className="text-sm text-destructive">Something went wrong loading announcements.</p>
      ) : null}

      {announcementsQuery.isSuccess && announcementsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : null}

      {announcementsQuery.isSuccess && announcementsQuery.data.length > 0 ? (
        <AdminAnnouncementList announcements={announcementsQuery.data} />
      ) : null}
    </div>
  )
}
