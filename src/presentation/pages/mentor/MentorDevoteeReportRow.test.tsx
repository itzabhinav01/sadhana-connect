import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { MentorDevoteeReportRow } from '@/presentation/pages/mentor/MentorDevoteeReportRow'

const report: SadhanaReport = {
  id: 'r1',
  profileId: 'd1',
  reportDate: '2026-01-15',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: '08:00',
  totalRounds: 16,
  readingMinutes: 20,
  bookName: null,
  hearingMinutes: 30,
  speakerName: null,
  sleepTime: null,
  wakeTime: null,
  dayRestMinutes: 0,
  totalRestMinutes: 0,
  officeGoingTime: null,
  officeReturnTime: null,
  notes: null,
  signatureText: 'Devotee One',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('MentorDevoteeReportRow', () => {
  it('displays the date, rounds, reading, and hearing minutes', () => {
    render(<MentorDevoteeReportRow report={report} />)

    expect(screen.getByText('01/15/2026')).toBeInTheDocument()
    expect(screen.getByText(/16 rounds/)).toBeInTheDocument()
    expect(screen.getByText(/20m reading/)).toBeInTheDocument()
    expect(screen.getByText(/30m hearing/)).toBeInTheDocument()
  })

  it('is not a link — never navigates to the editable Sadhana form', () => {
    render(<MentorDevoteeReportRow report={report} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
