import { describe, expect, it } from 'vitest'

import { calculateMentorDevoteeSummaries } from './mentor-devotee-summary'
import type { MentorAssignedDevotee } from '@sadhana-connect/domain'
import type { SadhanaReport } from '@sadhana-connect/domain'

const TODAY = '2026-01-15'

function makeDevotee(overrides: Partial<MentorAssignedDevotee>): MentorAssignedDevotee {
  return {
    devoteeId: 'devotee-1',
    fullName: 'Devotee One',
    assignedAt: '2025-12-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeReport(overrides: Partial<SadhanaReport>): SadhanaReport {
  return {
    id: 'report-1',
    profileId: 'devotee-1',
    reportDate: TODAY,
    roundsBefore430: 0,
    roundsTill7am: 0,
    lastRoundTime: null,
    totalRounds: 16,
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
    signatureText: 'Devotee One',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  }
}

describe('calculateMentorDevoteeSummaries', () => {
  it('marks a devotee as submitted today with the correct total rounds', () => {
    const devotees = [makeDevotee({ devoteeId: 'd1' })]
    const reports = [makeReport({ profileId: 'd1', reportDate: TODAY, totalRounds: 20 })]

    const [summary] = calculateMentorDevoteeSummaries(devotees, reports, [], TODAY)

    expect(summary.hasSubmittedToday).toBe(true)
    expect(summary.todayTotalRounds).toBe(20)
  })

  it('marks a devotee as pending when there is no report for today', () => {
    const devotees = [makeDevotee({ devoteeId: 'd1' })]
    const reports = [makeReport({ profileId: 'd1', reportDate: '2026-01-10' })]

    const [summary] = calculateMentorDevoteeSummaries(devotees, reports, [], TODAY)

    expect(summary.hasSubmittedToday).toBe(false)
    expect(summary.todayTotalRounds).toBeNull()
  })

  it('marks a devotee as pending when they have no reports at all', () => {
    const devotees = [makeDevotee({ devoteeId: 'd1' })]

    const [summary] = calculateMentorDevoteeSummaries(devotees, [], [], TODAY)

    expect(summary.hasSubmittedToday).toBe(false)
    expect(summary.todayTotalRounds).toBeNull()
  })

  it('attaches the all-time last report date from the view data, independent of the recent-reports window', () => {
    const devotees = [makeDevotee({ devoteeId: 'd1' })]

    const [summary] = calculateMentorDevoteeSummaries(
      devotees,
      [],
      [{ devoteeId: 'd1', lastReportDate: '2025-06-01' }],
      TODAY,
    )

    expect(summary.lastReportDate).toBe('2025-06-01')
  })

  it('reports null last report date when the view has no entry for this devotee', () => {
    const devotees = [makeDevotee({ devoteeId: 'd1' })]

    const [summary] = calculateMentorDevoteeSummaries(devotees, [], [], TODAY)

    expect(summary.lastReportDate).toBeNull()
  })

  it('keeps each devotee isolated from other devotees in the same batch', () => {
    const devotees = [
      makeDevotee({ devoteeId: 'd1', fullName: 'Devotee One' }),
      makeDevotee({ devoteeId: 'd2', fullName: 'Devotee Two' }),
    ]
    const reports = [
      makeReport({ profileId: 'd1', reportDate: TODAY, totalRounds: 16 }),
    ]
    const lastReportDates = [
      { devoteeId: 'd1', lastReportDate: TODAY },
      { devoteeId: 'd2', lastReportDate: '2025-01-01' },
    ]

    const summaries = calculateMentorDevoteeSummaries(devotees, reports, lastReportDates, TODAY)

    const d1 = summaries.find((s) => s.devoteeId === 'd1')
    const d2 = summaries.find((s) => s.devoteeId === 'd2')

    expect(d1?.hasSubmittedToday).toBe(true)
    expect(d1?.todayTotalRounds).toBe(16)
    expect(d2?.hasSubmittedToday).toBe(false)
    expect(d2?.todayTotalRounds).toBeNull()
    expect(d2?.lastReportDate).toBe('2025-01-01')
  })

  it('returns an empty list for an empty devotee list', () => {
    expect(calculateMentorDevoteeSummaries([], [], [], TODAY)).toEqual([])
  })

  it('carries assignedAt through unchanged', () => {
    const devotees = [makeDevotee({ devoteeId: 'd1', assignedAt: '2024-03-10T00:00:00.000Z' })]

    const [summary] = calculateMentorDevoteeSummaries(devotees, [], [], TODAY)

    expect(summary.assignedAt).toBe('2024-03-10T00:00:00.000Z')
  })
})
