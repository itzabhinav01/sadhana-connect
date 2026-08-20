import { describe, expect, it } from 'vitest'

import {
  formatSadhanaReportForText,
  formatSadhanaReportsRangeForText,
} from '@/application/sadhana/format-sadhana-report-for-text'
import type { SadhanaReport } from '@/domain/entities/sadhana-report'

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

const EXPECTED_SINGLE = [
  'SADHANA REPORT',
  'Date: 05-01-2026',
  '',
  'Chanting',
  'Rounds before 4:30 AM: 4 Rounds',
  'Rounds till 7 AM: 8 Rounds',
  'Last Round Time: 6:45 AM',
  'Total Rounds: 16 Rounds',
  '',
  'Reading',
  'Reading Minutes: 15 min',
  'Book Name: Bhagavad-gītā As It Is',
  '',
  'Hearing',
  'Hearing Minutes: 30 min',
  'Speaker Name: HG Example Prabhu',
  '',
  'Rest & Sleep',
  'Sleep Time: 10:00 PM',
  'Wake Up: 4:00 AM',
  'Day Rest: 20 min',
  'Total Rest: 45 min',
  '',
  'Schedule',
  'Office Going: 9:30 AM',
  'Office Return: 6:00 PM',
  '',
  'Notes',
  'Felt good today.',
  '',
  'Signature',
  'Test Devotee Dasa',
].join('\n')

describe('formatSadhanaReportForText', () => {
  it('renders the exact standalone single-report text output', () => {
    expect(formatSadhanaReportForText(makeReport())).toBe(EXPECTED_SINGLE)
  })

  it('does not reuse the WhatsApp greeting/template', () => {
    const text = formatSadhanaReportForText(makeReport())

    expect(text).not.toContain('Hare Krishna')
    expect(text).not.toContain('Dandvat pranam')
    expect(text).not.toMatch(/:-/)
  })

  it('includes Notes and Signature', () => {
    const text = formatSadhanaReportForText(
      makeReport({ notes: 'Custom note text', signatureText: 'Umang Dasa' }),
    )

    expect(text).toContain('Notes\nCustom note text')
    expect(text).toContain('Signature\nUmang Dasa')
  })

  it('renders — for a null Notes field', () => {
    const text = formatSadhanaReportForText(makeReport({ notes: null }))

    expect(text).toContain('Notes\n—')
  })

  it('preserves Unicode and diacritics verbatim', () => {
    const text = formatSadhanaReportForText(
      makeReport({
        bookName: 'Śrīmad-Bhāgavatam',
        speakerName: 'HH Rādhānātha Swami',
        notes: 'हरे कृष्ण — देवनागरी परीक्षण',
      }),
    )

    expect(text).toContain('Book Name: Śrīmad-Bhāgavatam')
    expect(text).toContain('Speaker Name: HH Rādhānātha Swami')
    expect(text).toContain('हरे कृष्ण — देवनागरी परीक्षण')
  })
})

describe('formatSadhanaReportsRangeForText', () => {
  it('renders the header with the exact date range', () => {
    const text = formatSadhanaReportsRangeForText(
      [makeReport()],
      '2026-01-01',
      '2026-01-31',
    )

    expect(text.startsWith('SADHANA REPORTS\nDate Range: 01-01-2026 to 31-01-2026')).toBe(
      true,
    )
  })

  it('orders reports chronologically oldest to newest regardless of input order', () => {
    const oldest = makeReport({ id: 'r1', reportDate: '2026-01-01' })
    const middle = makeReport({ id: 'r2', reportDate: '2026-01-15' })
    const newest = makeReport({ id: 'r3', reportDate: '2026-01-31' })

    const text = formatSadhanaReportsRangeForText(
      [newest, oldest, middle],
      '2026-01-01',
      '2026-01-31',
    )

    const dateOccurrences = [...text.matchAll(/Date: (\d{2}-\d{2}-\d{4})/g)].map(
      (m) => m[1],
    )
    expect(dateOccurrences).toEqual(['01-01-2026', '15-01-2026', '31-01-2026'])
  })

  it('includes one complete report section per submitted day', () => {
    const text = formatSadhanaReportsRangeForText(
      [
        makeReport({ id: 'r1', reportDate: '2026-01-01' }),
        makeReport({ id: 'r2', reportDate: '2026-01-02' }),
      ],
      '2026-01-01',
      '2026-01-02',
    )

    expect(text.match(/^Chanting$/gm)).toHaveLength(2)
    expect(text.match(/^Signature$/gm)).toHaveLength(2)
  })

  it('renders a clear message and no report sections for an empty range', () => {
    const text = formatSadhanaReportsRangeForText([], '2026-01-01', '2026-01-31')

    expect(text).toBe(
      'SADHANA REPORTS\nDate Range: 01-01-2026 to 31-01-2026\n\nNo Sadhana reports were submitted in this date range.',
    )
    expect(text).not.toContain('Chanting')
  })
})
