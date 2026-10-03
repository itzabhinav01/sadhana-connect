import type { MentorDevoteeSummary } from './mentor-devotee-summary'

export const MENTOR_DEVOTEE_FILTERS = [
  'all',
  'submitted',
  'pending',
  'submitted_today',
  'needs_attention',
] as const
export type MentorDevoteeFilter = (typeof MENTOR_DEVOTEE_FILTERS)[number]

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
