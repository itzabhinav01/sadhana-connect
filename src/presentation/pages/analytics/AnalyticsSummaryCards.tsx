import type { SadhanaAnalyticsSummary } from '@sadhana-connect/sadhana'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

interface AnalyticsSummaryCardsProps {
  summary: SadhanaAnalyticsSummary
}

function formatMinutes(value: number) {
  return `${Math.round(value)} min`
}

function formatHours(value: number) {
  return `${Math.round(value)} hr`
}

function formatAverage(value: number, hasSubmittedDays: boolean, format: (v: number) => string) {
  return hasSubmittedDays ? format(value) : '—'
}

export function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  const hasSubmittedDays = summary.totalReports > 0

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Rounds</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-muted-foreground">Total</dt>
              <dd className="text-lg font-semibold text-foreground">
                {summary.totalRounds}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Avg / submitted day
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatAverage(summary.averageRoundsPerSubmittedDay, hasSubmittedDays, (v) =>
                  v.toFixed(1),
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Completion</dt>
              <dd className="text-lg font-semibold text-foreground">
                {Math.round(summary.completionRate * 100)}% (
                {summary.totalReports}/{summary.totalDays} days)
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Study</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-muted-foreground">Reading total</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatMinutes(summary.totalReadingMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reading avg/day</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatAverage(
                  summary.averageReadingMinutesPerSubmittedDay,
                  hasSubmittedDays,
                  formatMinutes,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Hearing total</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatMinutes(summary.totalHearingMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Hearing avg/day</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatAverage(
                  summary.averageHearingMinutesPerSubmittedDay,
                  hasSubmittedDays,
                  formatMinutes,
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Rest</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-muted-foreground">Day rest total</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatMinutes(summary.totalDayRestMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Day rest avg/day</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatAverage(
                  summary.averageDayRestMinutesPerSubmittedDay,
                  hasSubmittedDays,
                  formatMinutes,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Total rest total
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatHours(summary.totalRestMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Total rest avg/day
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatAverage(
                  summary.averageTotalRestMinutesPerSubmittedDay,
                  hasSubmittedDays,
                  formatHours,
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
