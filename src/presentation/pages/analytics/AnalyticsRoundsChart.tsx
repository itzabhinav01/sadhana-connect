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

import type { RoundsChartPoint } from '@sadhana-connect/sadhana'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

interface AnalyticsRoundsChartProps {
  chartData: RoundsChartPoint[]
}

function formatDayLabel(iso: string) {
  const [, month, day] = iso.split('-')
  return `${month}/${day}`
}

// Always a bar chart, regardless of range length (approved decision,
// Phase 9) — no adaptive bar/line switching for longer ranges.
export function AnalyticsRoundsChart({ chartData }: AnalyticsRoundsChartProps) {
  const totalRounds = chartData.reduce((sum, point) => sum + point.totalRounds, 0)
  const daysLogged = chartData.filter((point) => point.hasReport).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Daily Total Rounds</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Text equivalent for screen readers — the SVG chart below is
            decorative/supplementary to this summary. */}
        <p className="sr-only">
          Daily total rounds chart: {daysLogged} of {chartData.length} days
          logged, totaling {totalRounds} rounds.
        </p>

        <div aria-hidden="true" className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                {chartData.map((point) => (
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
      </CardContent>
    </Card>
  )
}
