import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { StudyChartPoint } from '@/application/sadhana/sadhana-analytics'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

interface AnalyticsStudyChartProps {
  chartData: StudyChartPoint[]
}

function formatDayLabel(iso: string) {
  const [, month, day] = iso.split('-')
  return `${month}/${day}`
}

// The two series are distinguished by the Legend's text labels (and the
// tooltip/sr-only summary), never by line color alone.
export function AnalyticsStudyChart({ chartData }: AnalyticsStudyChartProps) {
  const totalReading = chartData.reduce((sum, point) => sum + point.readingMinutes, 0)
  const totalHearing = chartData.reduce((sum, point) => sum + point.hearingMinutes, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Reading &amp; Hearing</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="sr-only">
          Reading and hearing minutes chart: {totalReading} reading minutes
          and {totalHearing} hearing minutes across {chartData.length} days.
        </p>

        <div aria-hidden="true" className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
                tick={{ fontSize: 12 }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(value) => formatDayLabel(String(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="readingMinutes"
                name="Reading"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="hearingMinutes"
                name="Hearing"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
