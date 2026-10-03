import { Search } from 'lucide-react'
import { useState } from 'react'

import { useAdminUsers, useMentorDevoteeCounts } from '@sadhana-connect/admin'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { AdminMentorList } from '@/presentation/pages/admin/AdminMentorList'

// A filtered view of the shared user-management architecture — same
// useAdminUsers hook as /admin/users, pre-filtered to role: 'mentor', not
// a parallel system.
export function AdminMentorsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const mentorsQuery = useAdminUsers({ role: 'mentor' })
  const countsQuery = useMentorDevoteeCounts()

  const mentors = mentorsQuery.data?.pages.flatMap((page) => page.users) ?? []
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const visibleMentors = normalizedSearch
    ? mentors.filter((mentor) => mentor.fullName.toLowerCase().includes(normalizedSearch))
    : mentors

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
        <>
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search mentors by name…"
              aria-label="Search mentors by name"
              className="pl-9"
            />
          </div>
          {visibleMentors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mentors match this search.</p>
          ) : (
            <AdminMentorList mentors={visibleMentors} counts={countsQuery.data} />
          )}
        </>
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
