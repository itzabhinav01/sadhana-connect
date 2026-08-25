import { addDaysIso } from '@sadhana-connect/shared'

// Consecutive calendar days with a saved report (approved product
// decision, Phase 7). If today has no report yet, that does not break
// the streak — counting simply starts from yesterday until today is
// completed. If yesterday is also missing, the streak is genuinely 0.
//
// Known limitation: `reportDates` is expected to come from a bounded
// lookback (60 days for v1 — see useRecentSadhanaReports). A streak
// longer than that window will be undercounted. This is an accepted
// simplification, not a bug: widening the window or adding a dedicated
// aggregate is a future change if it's ever actually hit.
export function calculateStreak(reportDates: string[], today: string): number {
  const dateSet = new Set(reportDates)
  let cursor = dateSet.has(today) ? today : addDaysIso(today, -1)
  let streak = 0

  while (dateSet.has(cursor)) {
    streak += 1
    cursor = addDaysIso(cursor, -1)
  }

  return streak
}
