import { useState } from 'react'

import { filterMentorDevotees, type MentorDevoteeFilter } from '@/application/mentor/mentor-devotee-filter'
import { useMentorDevotees } from '@/application/mentor/use-mentor-devotees'
import { MentorDevoteeFilterTabs } from '@/presentation/pages/mentor/MentorDevoteeFilterTabs'
import { MentorDevoteeList } from '@/presentation/pages/mentor/MentorDevoteeList'
import { MentorSummaryCards } from '@/presentation/pages/mentor/MentorSummaryCards'

export function MentorDashboardPage() {
  const [filter, setFilter] = useState<MentorDevoteeFilter>('all')
  const devoteesQuery = useMentorDevotees()

  const summaries = devoteesQuery.data ?? []
  const filteredSummaries = filterMentorDevotees(summaries, filter)

  return (
    <div className="flex flex-col gap-6">
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
          <MentorDevoteeFilterTabs filter={filter} onFilterChange={setFilter} />
          {filteredSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No devotees match this filter.
            </p>
          ) : (
            <MentorDevoteeList summaries={filteredSummaries} />
          )}
        </>
      ) : null}
    </div>
  )
}
