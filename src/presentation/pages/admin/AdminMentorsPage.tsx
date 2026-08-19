import { useAdminUsers } from '@/application/admin/use-admin-users'
import { useMentorDevoteeCounts } from '@/application/admin/use-mentor-devotee-counts'
import { Button } from '@/presentation/components/ui/button'
import { AdminMentorList } from '@/presentation/pages/admin/AdminMentorList'

// A filtered view of the shared user-management architecture — same
// useAdminUsers hook as /admin/users, pre-filtered to role: 'mentor', not
// a parallel system.
export function AdminMentorsPage() {
  const mentorsQuery = useAdminUsers({ role: 'mentor' })
  const countsQuery = useMentorDevoteeCounts()

  const mentors = mentorsQuery.data?.pages.flatMap((page) => page.users) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mentors</h1>
        <p className="text-muted-foreground">Every mentor and how many devotees they currently have.</p>
      </div>

      {mentorsQuery.isPending || countsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {mentorsQuery.isError || countsQuery.isError ? (
        <p className="text-sm text-destructive">Something went wrong loading mentors.</p>
      ) : null}

      {mentorsQuery.isSuccess && mentors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No mentors yet.</p>
      ) : null}

      {mentors.length > 0 && countsQuery.data ? (
        <AdminMentorList mentors={mentors} counts={countsQuery.data} />
      ) : null}

      {mentorsQuery.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => mentorsQuery.fetchNextPage()}
          disabled={mentorsQuery.isFetchingNextPage}
          className="self-center"
        >
          {mentorsQuery.isFetchingNextPage ? 'Loading more…' : 'Load more'}
        </Button>
      ) : null}
    </div>
  )
}
