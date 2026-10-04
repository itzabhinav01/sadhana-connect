import { describe, expect, it } from 'vitest'

import {
  buildSadhanaHistoryCsv,
  buildSadhanaHistoryXlsxBase64,
  buildSadhanaHistoryXlsxBytes,
} from './sadhana-export-csv'
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
  it('produces metadata header, daily table, and activity averages section', () => {
    const csv = buildSadhanaHistoryCsv([makeReport()], 'Abhinav Sharma')
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe('Abhinav Sharma')
    expect(lines[1]).toBe('Group,Personal Sadhana')
    expect(lines[2]).toBe('Subgroup,My Sadhana')
    expect(lines[3]).toBe('Days Reported,1')
    expect(lines[5]).toContain('Date,Chanting,Reading(MIN),Wake Up Time,Day Rest(MIN),Hearing(MIN)')
    expect(lines[6]).toContain('05 Jan 2026,16,15,4:00 AM,20,30,15,6:45 AM')
    expect(csv).toContain('Activity averages')
    expect(csv).toContain('Chanting,16')
    expect(csv).toContain('Reading(MIN),15')
    expect(csv).toContain('Wake Up Time,4:00 AM')
  })

  it('uses "-" for zero or unset activity values and averages only reported days', () => {
    const csv = buildSadhanaHistoryCsv([
      makeReport({
        id: 'r1',
        reportDate: '2026-10-01',
        totalRounds: 0,
        readingMinutes: 101,
        wakeTime: null,
        dayRestMinutes: 0,
        hearingMinutes: 0,
        lastRoundTime: null,
      }),
      makeReport({
        id: 'r2',
        reportDate: '2026-10-03',
        totalRounds: 16,
        readingMinutes: 60,
        wakeTime: '04:00',
        dayRestMinutes: 120,
        hearingMinutes: 61,
        lastRoundTime: '08:00',
      }),
    ])

    expect(csv).toContain('01 Oct 2026,-,101,-,-,-,101,-')
    expect(csv).toContain('03 Oct 2026,16,60,4:00 AM,120,61,60,8:00 AM')
    expect(csv).toContain('Chanting,16')
    expect(csv).toContain('Reading(MIN),80.5')
    expect(csv).toContain('Wake Up Time,4:00 AM')
    expect(csv).toContain('Day Rest(MIN),120')
    expect(csv).toContain('Hearing(MIN),61')
    expect(csv).toContain('Chanting Completion Time,8:00 AM')
  })

  it('quotes a field containing a comma, doubling any internal quotes', () => {
    const csv = buildSadhanaHistoryCsv([
      makeReport({ notes: 'Read "Bhagavad-gita," chapter 2' }),
    ])
    expect(csv).toContain('"Read ""Bhagavad-gita,"" chapter 2"')
  })

  it('sorts oldest to newest regardless of input order', () => {
    const csv = buildSadhanaHistoryCsv([
      makeReport({ id: 'r2', reportDate: '2026-01-10' }),
      makeReport({ id: 'r1', reportDate: '2026-01-05' }),
    ])
    const idx1 = csv.indexOf('05 Jan 2026')
    const idx2 = csv.indexOf('10 Jan 2026')
    expect(idx1).toBeGreaterThan(-1)
    expect(idx2).toBeGreaterThan(idx1)
  })

  it('builds a valid OpenXML .xlsx ZIP workbook with styles and worksheet entries', () => {
    const bytes = buildSadhanaHistoryXlsxBytes(
      [
        makeReport({ id: 'r1', reportDate: '2026-01-05', totalRounds: 12 }),
        makeReport({ id: 'r2', reportDate: '2026-01-06', totalRounds: 16 }),
      ],
      'Abhinav Sharma',
    )

    // ZIP local file header signature: PK\x03\x04
    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
    expect(bytes[2]).toBe(0x03)
    expect(bytes[3]).toBe(0x04)

    const rawText = new TextDecoder().decode(bytes)
    expect(rawText).toContain('[Content_Types].xml')
    expect(rawText).toContain('xl/styles.xml')
    expect(rawText).toContain('xl/worksheets/sheet1.xml')
    expect(rawText).toContain('Abhinav Sharma')
    expect(rawText).toContain('FFFEE2E2') // Red fill for < 16 rounds
    expect(rawText).toContain('FFDCFCE7') // Green fill for >= 16 rounds

    const b64 = buildSadhanaHistoryXlsxBase64([makeReport()], 'Abhinav Sharma')
    expect(b64.startsWith('UEsDB')).toBe(true)
  })
})
