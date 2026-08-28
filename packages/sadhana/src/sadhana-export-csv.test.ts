import { describe, expect, it } from 'vitest'

import { buildSadhanaHistoryCsv } from './sadhana-export-csv'
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

describe('buildSadhanaHistoryCsv', () => {
  it('produces a header row plus one row per report, comma-separated', () => {
    const csv = buildSadhanaHistoryCsv([makeReport()])
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe(
      'Date,Rounds Before 4:30 AM,Rounds Till 7 AM,Last Round Time,Total Rounds,' +
        'Reading Minutes,Book Name,Hearing Minutes,Speaker Name,Sleep Time,Wake Up,' +
        'Day Rest (min),Total Rest (min),Office Going,Office Return,Notes,Signature',
    )
    expect(lines[1]).toBe(
      '2026-01-05,4,8,6:45 AM,16,15,Bhagavad-gītā As It Is,30,HG Example Prabhu,' +
        '10:00 PM,4:00 AM,20,45,9:30 AM,6:00 PM,Felt good today.,Test Devotee Dasa',
    )
  })

  it('leaves numeric fields as bare numbers, not "16 Rounds"-style text', () => {
    const csv = buildSadhanaHistoryCsv([makeReport({ totalRounds: 16 })])
    expect(csv).toContain(',16,')
    expect(csv).not.toContain('Rounds"')
  })

  it('quotes a field containing a comma, doubling any internal quotes', () => {
    const csv = buildSadhanaHistoryCsv([
      makeReport({ notes: 'Read "Bhagavad-gita," chapter 2' }),
    ])
    expect(csv).toContain('"Read ""Bhagavad-gita,"" chapter 2"')
  })

  it('writes an empty field for null book name, speaker name, and notes', () => {
    const csv = buildSadhanaHistoryCsv([
      makeReport({ bookName: null, speakerName: null, notes: null }),
    ])
    const dataLine = csv.split('\r\n')[1]
    expect(dataLine.split(',')).toContain('')
  })

  it('sorts oldest to newest regardless of input order', () => {
    const csv = buildSadhanaHistoryCsv([
      makeReport({ id: 'r2', reportDate: '2026-01-10' }),
      makeReport({ id: 'r1', reportDate: '2026-01-05' }),
    ])
    const lines = csv.split('\r\n')
    expect(lines[1]).toContain('2026-01-05')
    expect(lines[2]).toContain('2026-01-10')
  })

  it('returns just the header row for an empty report list', () => {
    const csv = buildSadhanaHistoryCsv([])
    expect(csv.split('\r\n')).toHaveLength(1)
  })
})
