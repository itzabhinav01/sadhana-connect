import { describe, expect, it } from 'vitest'

import {
  extractMentorDevoteeGroups,
  filterMentorDevotees,
  filterMentorDevoteesByGroup,
} from './mentor-devotee-filter'
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
  const submitted = makeSummary({
    devoteeId: 'submitted',
    hasSubmittedYesterday: true,
    hasSubmittedToday: true,
  })
  const pending = makeSummary({
    devoteeId: 'pending',
    hasSubmittedYesterday: false,
    hasSubmittedToday: false,
  })
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

  it('"submitted_today" returns only devotees who submitted today', () => {
    expect(filterMentorDevotees(summaries, 'submitted_today')).toEqual([submitted])
  })

  it('"needs_attention" returns devotees who missed both yesterday and today', () => {
    expect(filterMentorDevotees(summaries, 'needs_attention')).toEqual([pending])
  })
})

describe('extractMentorDevoteeGroups and filterMentorDevoteesByGroup', () => {
  const youthA = makeSummary({
    devoteeId: 'd1',
    fullName: 'Arjuna',
    templeGroups: [
      { id: 'g1', name: 'BACE Youth' },
      { id: 'g2', name: 'Core Team' },
    ],
  })
  const youthB = makeSummary({
    devoteeId: 'd2',
    fullName: 'Bhima',
    templeGroups: [{ id: 'g1', name: 'BACE Youth' }],
  })
  const ungrouped = makeSummary({
    devoteeId: 'd3',
    fullName: 'Nakula',
    templeGroups: [],
  })
  const all = [youthA, youthB, ungrouped]

  it('extracts sorted unique groups with devotee counts', () => {
    expect(extractMentorDevoteeGroups(all)).toEqual([
      { id: 'g1', name: 'BACE Youth', count: 2 },
      { id: 'g2', name: 'Core Team', count: 1 },
    ])
  })

  it('filters devotees by specific group id (supporting multi-group membership)', () => {
    expect(filterMentorDevoteesByGroup(all, 'g1')).toEqual([youthA, youthB])
    expect(filterMentorDevoteesByGroup(all, 'g2')).toEqual([youthA])
  })

  it('filters ungrouped devotees when "ungrouped" is selected', () => {
    expect(filterMentorDevoteesByGroup(all, 'ungrouped')).toEqual([ungrouped])
  })
})
