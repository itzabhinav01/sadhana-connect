import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useWeeklySadhanaSummary } from '@sadhana-connect/sadhana'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

function formatDayLabel(iso: string) {
  const [, month, day] = iso.split('-')
  return `${month}/${day}`
}

export function WeeklyRoundsChart() {
  const summaryQuery = useWeeklySadhanaSummary()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Weekly Rounds</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summaryQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading chart…</p>
        ) : null}

        {summaryQuery.isError ? (
          <p className="text-sm text-destructive">
            Something went wrong loading the weekly chart.
          </p>
        ) : null}

        {summaryQuery.data ? (
          <>
            {summaryQuery.data.totalReports === 0 ? (
              <p className="mb-2 text-sm text-muted-foreground">
                No sadhana logged this week yet.
              </p>
            ) : null}

            {/* Text equivalent for screen readers — the SVG chart below
                is decorative/supplementary to this summary. */}
            <p className="sr-only">
              Weekly rounds chart: {summaryQuery.data.totalReports} of 7
              days logged this week, totaling{' '}
              {summaryQuery.data.chartData.reduce(
                (sum, point) => sum + point.totalRounds,
                0,
              )}{' '}
              rounds.
            </p>

            <div aria-hidden="true" className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryQuery.data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDayLabel}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(value) => formatDayLabel(String(value))}
                    formatter={(value) => [`${value ?? 0}`, 'Rounds']}
                  />
                  <Bar dataKey="totalRounds" radius={[4, 4, 0, 0]}>
                    {summaryQuery.data.chartData.map((point) => (
                      <Cell
                        key={point.date}
                        fill={
                          point.hasReport
                            ? 'var(--color-primary)'
                            : 'var(--color-muted)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
