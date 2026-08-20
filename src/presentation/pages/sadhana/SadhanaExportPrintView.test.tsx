import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { SadhanaExportPrintView } from '@/presentation/pages/sadhana/SadhanaExportPrintView'

function makeReport(overrides: Partial<SadhanaReport> = {}): SadhanaReport {
  return {
    id: 'report-1',
    profileId: 'user-1',
    reportDate: '2026-01-05',
    roundsBefore430: 4,
    roundsTill7am: 8,
    lastRoundTime: '06:45',
    totalRounds: 16,
    readingMinutes: 15,
    bookName: 'Bhagavad-gītā As It Is',
    hearingMinutes: 30,
    speakerName: 'HG Example Prabhu',
    sleepTime: '22:00',
    wakeTime: '04:00',
    dayRestMinutes: 20,
    totalRestMinutes: 45,
    officeGoingTime: '09:30',
    officeReturnTime: '18:00',
    notes: 'Felt good today.',
    signatureText: 'Test Devotee Dasa',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
    ...overrides,
  }
}

describe('SadhanaExportPrintView — single mode', () => {
  it('renders the report date, all section headings, and field values', () => {
    render(<SadhanaExportPrintView mode="single" report={makeReport()} />)

    expect(screen.getByText('Sadhana Report')).toBeInTheDocument()
    expect(screen.getByText('Date: 05-01-2026')).toBeInTheDocument()
    expect(screen.getByText('Chanting')).toBeInTheDocument()
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Hearing')).toBeInTheDocument()
    expect(screen.getByText('Rest & Sleep')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText('Signature')).toBeInTheDocument()
    expect(screen.getByText('6:45 AM')).toBeInTheDocument()
    expect(screen.getByText('Felt good today.')).toBeInTheDocument()
    expect(screen.getByText('Test Devotee Dasa')).toBeInTheDocument()
  })

  it('is hidden on screen and only shown for print', () => {
    const { container } = render(
      <SadhanaExportPrintView mode="single" report={makeReport()} />,
    )

    const root = container.querySelector('.sadhana-print-view')
    expect(root).toHaveClass('hidden')
    expect(root).toHaveClass('print:block')
  })
})

describe('SadhanaExportPrintView — range mode', () => {
  it('renders the document title and exact date range', () => {
    render(
      <SadhanaExportPrintView
        mode="range"
        reports={[makeReport()]}
        fromDate="2026-01-01"
        toDate="2026-01-31"
      />,
    )

    expect(screen.getByText('Sadhana Reports')).toBeInTheDocument()
    expect(
      screen.getByText('Date Range: 01-01-2026 to 31-01-2026'),
    ).toBeInTheDocument()
  })

  it('renders one report section per report, ordered oldest to newest', () => {
    const oldest = makeReport({ id: 'r1', reportDate: '2026-01-01' })
    const newest = makeReport({ id: 'r2', reportDate: '2026-01-15' })

    render(
      <SadhanaExportPrintView
        mode="range"
        reports={[newest, oldest]}
        fromDate="2026-01-01"
        toDate="2026-01-15"
      />,
    )

    const dateHeadings = screen.getAllByText(/^Date: /)
    expect(dateHeadings.map((el) => el.textContent)).toEqual([
      'Date: 01-01-2026',
      'Date: 15-01-2026',
    ])
  })

  it('shows a clear message and no report content for an empty range', () => {
    render(
      <SadhanaExportPrintView
        mode="range"
        reports={[]}
        fromDate="2026-01-01"
        toDate="2026-01-31"
      />,
    )

    expect(
      screen.getByText('No Sadhana reports were submitted in this date range.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Chanting')).not.toBeInTheDocument()
  })
})
