import { addDaysIso } from '@sadhana-connect/shared'
import type { DevoteeLastReportDate } from '@sadhana-connect/domain'
import type { MentorAssignedDevotee } from '@sadhana-connect/domain'
import type { MentorDevoteeReportSummary } from '@sadhana-connect/domain'

export interface MentorDevoteeSummary {
  devoteeId: string
  fullName: string
  assignedAt: string
  hasSubmittedYesterday: boolean
  yesterdayTotalRounds: number | null
  hasSubmittedToday: boolean
  todayTotalRounds: number | null
  lastReportDate: string | null
}

// Pure merge of the three fetched, already-authorized result sets into
// one row per assigned devotee — no network call here, fully
// unit-testable. `today` defaults to the real local date but is
// parameterizable for deterministic tests.
export function calculateMentorDevoteeSummaries(
  devotees: MentorAssignedDevotee[],
  recentReports: MentorDevoteeReportSummary[],
  lastReportDates: DevoteeLastReportDate[],
  today: string,
): MentorDevoteeSummary[] {
  const yesterday = addDaysIso(today, -1)

  const reportByDevoteeAndDate = new Map<string, MentorDevoteeReportSummary>()
  for (const report of recentReports) {
    reportByDevoteeAndDate.set(`${report.profileId}:${report.reportDate}`, report)
  }

  const lastReportDateByDevotee = new Map(
    lastReportDates.map((entry) => [entry.devoteeId, entry.lastReportDate]),
  )

  return devotees.map((devotee) => {
    const todayReport = reportByDevoteeAndDate.get(`${devotee.devoteeId}:${today}`)
    const yesterdayReport = reportByDevoteeAndDate.get(`${devotee.devoteeId}:${yesterday}`)

    return {
      devoteeId: devotee.devoteeId,
      fullName: devotee.fullName,
      assignedAt: devotee.assignedAt,
      hasSubmittedYesterday: yesterdayReport !== undefined,
      yesterdayTotalRounds: yesterdayReport?.totalRounds ?? null,
      hasSubmittedToday: todayReport !== undefined,
      todayTotalRounds: todayReport?.totalRounds ?? null,
      lastReportDate: lastReportDateByDevotee.get(devotee.devoteeId) ?? null,
    }
  })
}
