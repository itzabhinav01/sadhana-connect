import { Search } from 'lucide-react'
import { useState } from 'react'

import { filterMentorDevotees, type MentorDevoteeFilter, useMentorDevotees } from '@sadhana-connect/mentor'
import { Input } from '@/presentation/components/ui/input'
import { MentorDevoteeFilterTabs } from '@/presentation/pages/mentor/MentorDevoteeFilterTabs'
import { MentorDevoteeList } from '@/presentation/pages/mentor/MentorDevoteeList'
import { MentorSummaryCards } from '@/presentation/pages/mentor/MentorSummaryCards'

export function MentorDashboardPage() {
  const [filter, setFilter] = useState<MentorDevoteeFilter>('all')
  const [search, setSearch] = useState('')
  const devoteesQuery = useMentorDevotees()

  const summaries = devoteesQuery.data ?? []
  const statusFiltered = filterMentorDevotees(summaries, filter)
  const searchTerm = search.trim().toLowerCase()
  const filteredSummaries = searchTerm
    ? statusFiltered.filter((summary) => summary.fullName.toLowerCase().includes(searchTerm))
    : statusFiltered

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Mentor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor your assigned devotees&apos; daily sadhana.
        </p>
      </div>

      {devoteesQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {devoteesQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your devotees. Please try again.
        </p>
      ) : null}

      {devoteesQuery.isSuccess && summaries.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-6">
          <p className="text-sm text-muted-foreground">
            No devotees are currently assigned to you.
          </p>
        </div>
      ) : null}

      {devoteesQuery.isSuccess && summaries.length > 0 ? (
        <>
          <MentorSummaryCards summaries={summaries} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <MentorDevoteeFilterTabs filter={filter} onFilterChange={setFilter} />
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search devotees by name…"
                aria-label="Search devotees by name"
                className="pl-9"
              />
            </div>
          </div>
          {filteredSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No devotees match this search.' : 'No devotees match this filter.'}
            </p>
          ) : (
            <MentorDevoteeList summaries={filteredSummaries} />
          )}
        </>
      ) : null}
    </div>
  )
}
