import { describe, expect, it } from 'vitest'

import { filterMentorDevotees } from './mentor-devotee-filter'
import type { MentorDevoteeSummary } from './mentor-devotee-summary'

function makeSummary(overrides: Partial<MentorDevoteeSummary>): MentorDevoteeSummary {
  return {
    devoteeId: 'd1',
    fullName: 'Devotee',
    assignedAt: '2025-01-01T00:00:00.000Z',
    hasSubmittedYesterday: false,
    yesterdayTotalRounds: null,
    hasSubmittedToday: false,
    todayTotalRounds: null,
    lastReportDate: null,
    ...overrides,
  }
}

describe('filterMentorDevotees', () => {
  const submitted = makeSummary({ devoteeId: 'submitted', hasSubmittedYesterday: true })
  const pending = makeSummary({ devoteeId: 'pending', hasSubmittedYesterday: false })
  const summaries = [submitted, pending]

  it('"all" returns every devotee unchanged', () => {
    expect(filterMentorDevotees(summaries, 'all')).toEqual(summaries)
  })

  it('"submitted" returns only devotees who submitted yesterday', () => {
    expect(filterMentorDevotees(summaries, 'submitted')).toEqual([submitted])
  })

  it('"pending" returns only devotees who have not submitted yesterday', () => {
    expect(filterMentorDevotees(summaries, 'pending')).toEqual([pending])
  })
})
