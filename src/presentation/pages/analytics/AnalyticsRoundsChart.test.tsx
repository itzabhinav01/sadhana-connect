import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AnalyticsRoundsChart } from '@/presentation/pages/analytics/AnalyticsRoundsChart'

describe('AnalyticsRoundsChart', () => {
  it('renders a text-equivalent summary reflecting the chart data', () => {
    render(
      <AnalyticsRoundsChart
        chartData={[
          { date: '2026-01-14', totalRounds: 0, hasReport: false },
          { date: '2026-01-15', totalRounds: 16, hasReport: true },
        ]}
      />,
    )

    expect(
      screen.getByText(/1 of 2 days logged, totaling 16 rounds/i),
    ).toBeInTheDocument()
  })

  it('reflects a fixed-length domain even when every day is missing', () => {
    const chartData = Array.from({ length: 7 }, (_, index) => ({
      date: `2026-01-0${index + 1}`,
      totalRounds: 0,
      hasReport: false,
    }))

    render(<AnalyticsRoundsChart chartData={chartData} />)

    expect(
      screen.getByText(/0 of 7 days logged, totaling 0 rounds/i),
    ).toBeInTheDocument()
  })
})
