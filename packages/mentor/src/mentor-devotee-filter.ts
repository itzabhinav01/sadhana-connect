import type { MentorDevoteeGroup } from '@sadhana-connect/domain'
import type { MentorDevoteeSummary } from './mentor-devotee-summary'

export const MENTOR_DEVOTEE_FILTERS = [
  'all',
  'submitted',
  'pending',
  'submitted_today',
  'needs_attention',
] as const
export type MentorDevoteeFilter = (typeof MENTOR_DEVOTEE_FILTERS)[number]

// Special values for group filter: 'all' (every devotee), 'ungrouped' (devotees with 0 groups), or a temple_group_id
export type MentorGroupFilter = 'all' | 'ungrouped' | string

export interface MentorGroupOption extends MentorDevoteeGroup {
  count: number
}

// Extracts distinct groups across the mentor's assigned devotees, sorted alphabetically by group name, with member counts.
export function extractMentorDevoteeGroups(
  summaries: MentorDevoteeSummary[],
): MentorGroupOption[] {
  const byId = new Map<string, MentorGroupOption>()
  for (const summary of summaries) {
    for (const group of summary.templeGroups ?? []) {
      const existing = byId.get(group.id)
      if (existing) {
        existing.count += 1
      } else {
        byId.set(group.id, { id: group.id, name: group.name, count: 1 })
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function filterMentorDevoteesByGroup(
  summaries: MentorDevoteeSummary[],
  groupFilter: MentorGroupFilter,
): MentorDevoteeSummary[] {
  if (groupFilter === 'all') {
    return summaries
  }
  if (groupFilter === 'ungrouped') {
    return summaries.filter((summary) => (summary.templeGroups?.length ?? 0) === 0)
  }
  return summaries.filter((summary) =>
    (summary.templeGroups ?? []).some((group) => group.id === groupFilter),
  )
}

// Pure, client-side over an already-fetched, already-authorized list — no
// new query per filter change.
export function filterMentorDevotees(
  summaries: MentorDevoteeSummary[],
  filter: MentorDevoteeFilter,
): MentorDevoteeSummary[] {
  if (filter === 'submitted') {
    return summaries.filter((summary) => summary.hasSubmittedYesterday)
  }
  if (filter === 'pending') {
    return summaries.filter((summary) => !summary.hasSubmittedYesterday)
  }
  if (filter === 'submitted_today') {
    return summaries.filter((summary) => summary.hasSubmittedToday)
  }
  if (filter === 'needs_attention') {
    return summaries.filter(
      (summary) => !summary.hasSubmittedYesterday && !summary.hasSubmittedToday,
    )
  }
  return summaries
}
