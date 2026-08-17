import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AnalyticsStudyChart } from '@/presentation/pages/analytics/AnalyticsStudyChart'

describe('AnalyticsStudyChart', () => {
  it('renders a text-equivalent summary reflecting both series', () => {
    render(
      <AnalyticsStudyChart
        chartData={[
          { date: '2026-01-14', readingMinutes: 0, hearingMinutes: 0, hasReport: false },
          { date: '2026-01-15', readingMinutes: 15, hearingMinutes: 30, hasReport: true },
        ]}
      />,
    )

    expect(
      screen.getByText(/15 reading minutes and 30 hearing minutes across 2 days/i),
    ).toBeInTheDocument()
  })

  it('renders a heading distinct from the sr-only summary text', () => {
    render(
      <AnalyticsStudyChart
        chartData={[
          { date: '2026-01-15', readingMinutes: 15, hearingMinutes: 30, hasReport: true },
        ]}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /reading & hearing/i }),
    ).toBeInTheDocument()
  })
})
