import { describe, expect, it } from 'vitest'

import { buildSadhanaReportExportSections } from './sadhana-export-fields'
import type { SadhanaReport } from '@sadhana-connect/domain'

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

describe('buildSadhanaReportExportSections', () => {
  it('produces exactly the 7 required sections, in order', () => {
    const sections = buildSadhanaReportExportSections(makeReport())

    expect(sections.map((s) => s.title)).toEqual([
      'Chanting',
      'Reading',
      'Hearing',
      'Rest & Sleep',
      'Schedule',
      'Notes',
      'Signature',
    ])
  })

  it('maps every field with correct labels and values', () => {
    const [chanting, reading, hearing, rest, schedule, notes, signature] =
      buildSadhanaReportExportSections(makeReport())

    expect(chanting.fields).toEqual([
      { label: 'Rounds before 4:30 AM', value: '4 Rounds' },
      { label: 'Rounds till 7 AM', value: '8 Rounds' },
      { label: 'Last Round Time', value: '6:45 AM' },
      { label: 'Total Rounds', value: '16 Rounds' },
    ])
    expect(reading.fields).toEqual([
      { label: 'Reading Minutes', value: '15 min' },
      { label: 'Book Name', value: 'Bhagavad-gītā As It Is' },
    ])
    expect(hearing.fields).toEqual([
      { label: 'Hearing Minutes', value: '30 min' },
      { label: 'Speaker Name', value: 'HG Example Prabhu' },
    ])
    expect(rest.fields).toEqual([
      { label: 'Sleep Time', value: '10:00 PM' },
      { label: 'Wake Up', value: '4:00 AM' },
      { label: 'Day Rest', value: '20 min' },
      { label: 'Total Rest', value: '45 min' },
    ])
    expect(schedule.fields).toEqual([
      { label: 'Office Going', value: '9:30 AM' },
      { label: 'Office Return', value: '6:00 PM' },
    ])
    expect(notes.fields).toEqual([{ label: null, value: 'Felt good today.' }])
    expect(signature.fields).toEqual([{ label: null, value: 'Test Devotee Dasa' }])
  })

  it('renders an em dash for every unset nullable field', () => {
    const sections = buildSadhanaReportExportSections(
      makeReport({
        lastRoundTime: null,
        bookName: null,
        speakerName: null,
        sleepTime: null,
        wakeTime: null,
        officeGoingTime: null,
        officeReturnTime: null,
        notes: null,
      }),
    )
    const values = sections.flatMap((s) => s.fields.map((f) => f.value))

    expect(values.filter((v) => v === '—')).toHaveLength(8)
  })

  it('labels Total Rest and Day Rest in minutes, not hours', () => {
    const [, , , rest] = buildSadhanaReportExportSections(makeReport())

    const totalRest = rest.fields.find((f) => f.label === 'Total Rest')
    expect(totalRest?.value).toBe('45 min')
  })
})
