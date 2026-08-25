import type { MentorDevoteeSummary } from './mentor-devotee-summary'

export const MENTOR_DEVOTEE_FILTERS = ['all', 'submitted', 'pending'] as const
export type MentorDevoteeFilter = (typeof MENTOR_DEVOTEE_FILTERS)[number]

// Pure, client-side over an already-fetched, already-authorized list — no
// new query per filter change, matching the approved "no unnecessary
// analytics filters" scope.
export function filterMentorDevotees(
  summaries: MentorDevoteeSummary[],
  filter: MentorDevoteeFilter,
): MentorDevoteeSummary[] {
  if (filter === 'submitted') {
    return summaries.filter((summary) => summary.hasSubmittedToday)
  }
  if (filter === 'pending') {
    return summaries.filter((summary) => !summary.hasSubmittedToday)
  }
  return summaries
}
