import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { SadhanaReportSummaryRow } from '@/presentation/pages/sadhana/SadhanaReportSummaryRow'

const baseReport: SadhanaReport = {
  id: 'report-1',
  profileId: 'user-1',
  reportDate: '2026-01-15',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: null,
  totalRounds: 16,
  readingMinutes: 15,
  bookName: null,
  hearingMinutes: 30,
  speakerName: null,
  sleepTime: '22:00',
  wakeTime: '04:00',
  dayRestMinutes: 0,
  totalRestMinutes: 0,
  officeGoingTime: null,
  officeReturnTime: null,
  notes: null,
  signatureText: 'Test Devotee',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

function renderRow(
  props: Partial<ComponentProps<typeof SadhanaReportSummaryRow>>,
) {
  return render(
    <MemoryRouter>
      <SadhanaReportSummaryRow report={baseReport} {...props} />
    </MemoryRouter>,
  )
}

describe('SadhanaReportSummaryRow', () => {
  it('links to the dated Sadhana page', () => {
    renderRow({})

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/sadhana?date=2026-01-15',
    )
  })

  it('shows the formatted date', () => {
    renderRow({})

    expect(screen.getByText('01/15/2026')).toBeInTheDocument()
  })

  it('compact variant shows only total rounds', () => {
    renderRow({ variant: 'compact' })

    expect(screen.getByText('16 rounds')).toBeInTheDocument()
    expect(screen.queryByText(/reading/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/PM/)).not.toBeInTheDocument()
  })

  it('detailed variant shows rounds, reading, hearing, and sleep/wake', () => {
    renderRow({ variant: 'detailed' })

    expect(
      screen.getByText('16 rounds · 15m reading · 30m hearing'),
    ).toBeInTheDocument()
    expect(screen.getByText('10:00 PM → 4:00 AM')).toBeInTheDocument()
  })

  it('detailed variant omits the sleep/wake line when neither is present', () => {
    renderRow({
      variant: 'detailed',
      report: { ...baseReport, sleepTime: null, wakeTime: null },
    })

    expect(screen.queryByText(/→/)).not.toBeInTheDocument()
  })

  it('defaults to the detailed variant', () => {
    renderRow({})

    expect(
      screen.getByText('16 rounds · 15m reading · 30m hearing'),
    ).toBeInTheDocument()
  })
})
