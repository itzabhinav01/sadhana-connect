import { describe, expect, it } from 'vitest'

import { calculateWeeklySummary } from '@/application/sadhana/sadhana-weekly-summary'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'

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

const START = '2026-01-09'
const END = '2026-01-15' // 7 days inclusive

describe('calculateWeeklySummary', () => {
  it('produces a fixed 7-slot chart domain even with an empty dataset', () => {
    const summary = calculateWeeklySummary([], START, END)

    expect(summary.chartData).toHaveLength(7)
    expect(summary.chartData.every((point) => point.totalRounds === 0)).toBe(
      true,
    )
    expect(summary.chartData.every((point) => !point.hasReport)).toBe(true)
    expect(summary.totalReports).toBe(0)
    expect(summary.averageTotalRounds).toBe(0)
    expect(summary.completionRate).toBe(0)
  })

  it('fills gap days with zero, not a fabricated value, for a partial week', () => {
    const reports = [
      makeReport({ reportDate: '2026-01-15', totalRounds: 16 }),
      makeReport({ reportDate: '2026-01-13', totalRounds: 8 }),
    ]

    const summary = calculateWeeklySummary(reports, START, END)

    expect(summary.totalReports).toBe(2)
    expect(summary.completionRate).toBeCloseTo(2 / 7)

    const jan14 = summary.chartData.find((point) => point.date === '2026-01-14')
    expect(jan14?.totalRounds).toBe(0)
    expect(jan14?.hasReport).toBe(false)

    const jan15 = summary.chartData.find((point) => point.date === '2026-01-15')
    expect(jan15?.totalRounds).toBe(16)
    expect(jan15?.hasReport).toBe(true)
  })

  it('averages total rounds across submitted days only, not calendar days', () => {
    const reports = [
      makeReport({ reportDate: '2026-01-15', totalRounds: 16 }),
      makeReport({ reportDate: '2026-01-14', totalRounds: 8 }),
    ]

    const summary = calculateWeeklySummary(reports, START, END)

    // (16 + 8) / 2 submitted days = 12, NOT (16 + 8) / 7.
    expect(summary.averageTotalRounds).toBe(12)
  })

  it('computes a full week correctly', () => {
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
      }),
    )

    const summary = calculateWeeklySummary(reports, START, END)

    expect(summary.totalReports).toBe(7)
    expect(summary.completionRate).toBe(1)
    expect(summary.averageTotalRounds).toBe(16)
    expect(summary.totalReadingMinutes).toBe(105)
    expect(summary.totalHearingMinutes).toBe(210)
    expect(summary.chartData.every((point) => point.hasReport)).toBe(true)
  })

  it('handles a single day of data within the range', () => {
    const summary = calculateWeeklySummary(
      [makeReport({ reportDate: '2026-01-15', totalRounds: 4 })],
      START,
      END,
    )

    expect(summary.chartData).toHaveLength(7)
    expect(summary.totalReports).toBe(1)
    expect(summary.averageTotalRounds).toBe(4)
  })
})
