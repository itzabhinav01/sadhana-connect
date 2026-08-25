import { useAnnouncements } from '@/application/announcements/use-announcements'
import { useProfile } from '@sadhana-connect/auth'
import { MentorAnnouncementForm } from '@/presentation/pages/mentor/MentorAnnouncementForm'
import { MentorAnnouncementList } from '@/presentation/pages/mentor/MentorAnnouncementList'

export function MentorAnnouncementsPage() {
  const profile = useProfile()
  const announcementsQuery = useAnnouncements()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="text-muted-foreground">
          Temple group announcements you can see, and ones you&apos;ve posted.
        </p>
      </div>

      {profile.isSuccess && profile.data?.templeGroupId ? (
        <MentorAnnouncementForm />
      ) : null}

      {profile.isSuccess && !profile.data?.templeGroupId ? (
        <div className="rounded-lg border border-dashed p-6">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t been assigned to a temple group yet. Please
            contact your Super Admin.
          </p>
        </div>
      ) : null}

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
        <MentorAnnouncementList announcements={announcementsQuery.data} />
      ) : null}
    </div>
  )
}
