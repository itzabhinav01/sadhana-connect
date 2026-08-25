import { Link } from 'react-router-dom'

import { buildWhatsAppShareUrl } from '@/application/sadhana/format-sadhana-report-for-whatsapp'
import { useSadhanaReport } from '@sadhana-connect/sadhana'
import { useSadhanaStreak } from '@sadhana-connect/sadhana'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

export function TodaySadhanaCard() {
  const today = getLocalDateIso()
  const reportQuery = useSadhanaReport(today)
  const streakQuery = useSadhanaStreak()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Today&apos;s Sadhana</h2>
        </CardTitle>
        {streakQuery.data !== undefined ? (
          <CardDescription>
            Current streak: {streakQuery.data}{' '}
            {streakQuery.data === 1 ? 'day' : 'days'}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {reportQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {reportQuery.isError ? (
          <p className="text-sm text-destructive">
            Something went wrong loading today&apos;s sadhana. Please try
            again.
          </p>
        ) : null}

        {reportQuery.isSuccess && reportQuery.data === null ? (
          <>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t logged today&apos;s sadhana yet.
            </p>
            <Button asChild className="sm:self-start">
              <Link to="/sadhana">Fill Sadhana</Link>
            </Button>
          </>
        ) : null}

        {reportQuery.isSuccess && reportQuery.data ? (
          <>
            <p className="text-sm text-foreground">
              Today&apos;s sadhana is saved.
            </p>
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Total Rounds
                </dt>
                <dd className="text-lg font-semibold text-foreground">
                  {reportQuery.data.totalRounds}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reading</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {reportQuery.data.readingMinutes} min
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Hearing</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {reportQuery.data.hearingMinutes} min
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="sm:self-start">
                <Link to="/sadhana">Edit Sadhana</Link>
              </Button>
              <Button asChild variant="outline" className="sm:self-start">
                <a
                  href={buildWhatsAppShareUrl(reportQuery.data)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share to WhatsApp
                </a>
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
