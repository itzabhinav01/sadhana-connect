import { useParams } from 'react-router-dom'

import { useDevoteeAssignedSince } from '@/application/mentor/use-devotee-assigned-since'
import { useDevoteeProfile } from '@/application/mentor/use-devotee-profile'
import { useDevoteeRecentReports } from '@/application/mentor/use-devotee-recent-reports'
import { useDevoteeTodayReport } from '@/application/mentor/use-devotee-today-report'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { MentorDevoteeReportRow } from '@/presentation/pages/mentor/MentorDevoteeReportRow'

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

// If the mentor manually changes the URL to a devotee that isn't (or is
// no longer) theirs — or one that never existed — every query below
// resolves to null via RLS, exactly as it would for a genuinely missing
// id. This page never tries to tell those cases apart: doing so would
// mean the frontend is making an authorization decision, which it isn't
// — RLS already made it, by returning nothing.
export function MentorDevoteeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const devoteeId = id ?? ''

  const profileQuery = useDevoteeProfile(devoteeId)
  const todayReportQuery = useDevoteeTodayReport(devoteeId)
  const recentReportsQuery = useDevoteeRecentReports(devoteeId)
  const assignedSinceQuery = useDevoteeAssignedSince(devoteeId)

  return (
    <div className="flex flex-col gap-6">
      {profileQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {profileQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading this devotee. Please try again.
        </p>
      ) : null}

      {profileQuery.isSuccess && profileQuery.data === null ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-6">
          <p className="text-sm text-muted-foreground">
            This devotee isn&apos;t available.
          </p>
        </div>
      ) : null}

      {profileQuery.isSuccess && profileQuery.data ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {profileQuery.data.fullName}
            </h1>
            {assignedSinceQuery.data ? (
              <p className="text-muted-foreground">
                Assigned since{' '}
                {formatDisplayDate(assignedSinceQuery.data.slice(0, 10))}
              </p>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Today&apos;s Sadhana</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayReportQuery.isPending ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : null}
              {todayReportQuery.isError ? (
                <p className="text-sm text-destructive">
                  Something went wrong loading today&apos;s report.
                </p>
              ) : null}
              {todayReportQuery.isSuccess && todayReportQuery.data === null ? (
                <p className="text-sm text-muted-foreground">
                  Not submitted yet today.
                </p>
              ) : null}
              {todayReportQuery.isSuccess && todayReportQuery.data ? (
                <MentorDevoteeReportRow report={todayReportQuery.data} />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Recent Reports</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentReportsQuery.isPending ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : null}
              {recentReportsQuery.isError ? (
                <p className="text-sm text-destructive">
                  Something went wrong loading recent reports.
                </p>
              ) : null}
              {recentReportsQuery.data && recentReportsQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reports yet.
                </p>
              ) : null}
              {recentReportsQuery.data && recentReportsQuery.data.length > 0 ? (
                <ul className="flex flex-col divide-y divide-border">
                  {recentReportsQuery.data.map((report) => (
                    <li key={report.id}>
                      <MentorDevoteeReportRow report={report} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
