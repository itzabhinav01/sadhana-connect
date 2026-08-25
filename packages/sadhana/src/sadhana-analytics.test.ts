import { describe, expect, it } from 'vitest'

import { calculateSadhanaAnalytics } from './sadhana-analytics'
import type { SadhanaReport } from '@sadhana-connect/domain'

function makeReport(overrides: Partial<SadhanaReport>): SadhanaReport {
  return {
    id: 'report',
    profileId: 'user-1',
    reportDate: '2026-01-15',
    roundsBefore430: 0,
    roundsTill7am: 0,
    lastRoundTime: null,
    totalRounds: 0,
    readingMinutes: 0,
    bookName: null,
    hearingMinutes: 0,
    speakerName: null,
    sleepTime: null,
    wakeTime: null,
    dayRestMinutes: 0,
    totalRestMinutes: 0,
    officeGoingTime: null,
    officeReturnTime: null,
    notes: null,
    signatureText: 'Test Devotee',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  }
}

const FROM = '2026-01-09'
const TO = '2026-01-15' // 7 days inclusive

describe('calculateSadhanaAnalytics — empty dataset', () => {
  it('returns zeroed totals and a fixed-length, all-missing chart domain', () => {
    const summary = calculateSadhanaAnalytics([], FROM, TO)

    expect(summary.totalDays).toBe(7)
    expect(summary.totalReports).toBe(0)
    expect(summary.totalRounds).toBe(0)
    expect(summary.averageRoundsPerSubmittedDay).toBe(0)
    expect(summary.completionRate).toBe(0)
    expect(summary.roundsChartData).toHaveLength(7)
    expect(summary.roundsChartData.every((p) => p.totalRounds === 0)).toBe(true)
    expect(summary.roundsChartData.every((p) => !p.hasReport)).toBe(true)
    expect(summary.studyChartData).toHaveLength(7)
    expect(summary.studyChartData.every((p) => !p.hasReport)).toBe(true)
  })
})

describe('calculateSadhanaAnalytics — partial dataset', () => {
  it('excludes missing days from totals/averages but counts them in completionRate', () => {
    const reports = [
      makeReport({ reportDate: '2026-01-15', totalRounds: 16 }),
      makeReport({ reportDate: '2026-01-13', totalRounds: 8 }),
    ]

    const summary = calculateSadhanaAnalytics(reports, FROM, TO)

    expect(summary.totalReports).toBe(2)
    expect(summary.totalRounds).toBe(24)
    // (16 + 8) / 2 submitted days = 12, NOT / 7 calendar days.
    expect(summary.averageRoundsPerSubmittedDay).toBe(12)
    expect(summary.completionRate).toBeCloseTo(2 / 7)

    const missingDay = summary.roundsChartData.find(
      (p) => p.date === '2026-01-14',
    )
    expect(missingDay?.totalRounds).toBe(0)
    expect(missingDay?.hasReport).toBe(false)
  })

  it('treats a submitted report with total_rounds = 0 as a completed day, not a missing one', () => {
    const reports = [
      makeReport({ reportDate: '2026-01-15', totalRounds: 0 }),
      makeReport({ reportDate: '2026-01-14', totalRounds: 10 }),
    ]

    const summary = calculateSadhanaAnalytics(reports, FROM, TO)

    // Both days counted as submitted -> average is (0 + 10) / 2 = 5.
    expect(summary.totalReports).toBe(2)
    expect(summary.averageRoundsPerSubmittedDay).toBe(5)
    expect(summary.completionRate).toBeCloseTo(2 / 7)

    const zeroDay = summary.roundsChartData.find((p) => p.date === '2026-01-15')
    expect(zeroDay?.totalRounds).toBe(0)
    expect(zeroDay?.hasReport).toBe(true) // distinguishable from a missing day
  })
})

describe('calculateSadhanaAnalytics — full dataset', () => {
  it('computes totals, averages, and 100% completion for a fully submitted range', () => {
    const reports = [
      '2026-01-09',
      '2026-01-10',
      '2026-01-11',
      '2026-01-12',
      '2026-01-13',
      '2026-01-14',
      '2026-01-15',
    ].map((reportDate) =>
      makeReport({
        reportDate,
        totalRounds: 16,
        readingMinutes: 15,
        hearingMinutes: 30,
        dayRestMinutes: 20,
        totalRestMinutes: 360,
      }),
    )

    const summary = calculateSadhanaAnalytics(reports, FROM, TO)

    expect(summary.totalReports).toBe(7)
    expect(summary.completionRate).toBe(1)
    expect(summary.totalRounds).toBe(112)
    expect(summary.averageRoundsPerSubmittedDay).toBe(16)
    expect(summary.totalReadingMinutes).toBe(105)
    expect(summary.averageReadingMinutesPerSubmittedDay).toBe(15)
    expect(summary.totalHearingMinutes).toBe(210)
    expect(summary.averageHearingMinutesPerSubmittedDay).toBe(30)
    expect(summary.totalDayRestMinutes).toBe(140)
    expect(summary.averageDayRestMinutesPerSubmittedDay).toBe(20)
    expect(summary.totalRestMinutes).toBe(2520)
    expect(summary.averageTotalRestMinutesPerSubmittedDay).toBe(360)
    expect(summary.roundsChartData.every((p) => p.hasReport)).toBe(true)
  })
})

describe('calculateSadhanaAnalytics — rest independence', () => {
  it('never relates day_rest_minutes and total_rest_minutes to each other', () => {
    const reports = [
      makeReport({ reportDate: '2026-01-15', dayRestMinutes: 500, totalRestMinutes: 1 }),
    ]

    const summary = calculateSadhanaAnalytics(reports, FROM, TO)

    expect(summary.totalDayRestMinutes).toBe(500)
    expect(summary.totalRestMinutes).toBe(1)
  })
})

describe('calculateSadhanaAnalytics — chart shaping', () => {
  it('produces both chart series with the same fixed-length day domain', () => {
    const summary = calculateSadhanaAnalytics(
      [makeReport({ reportDate: '2026-01-15', readingMinutes: 10, hearingMinutes: 20 })],
      FROM,
      TO,
    )

    expect(summary.roundsChartData).toHaveLength(7)
    expect(summary.studyChartData).toHaveLength(7)
    const day = summary.studyChartData.find((p) => p.date === '2026-01-15')
    expect(day?.readingMinutes).toBe(10)
    expect(day?.hearingMinutes).toBe(20)
    expect(day?.hasReport).toBe(true)
  })
})
