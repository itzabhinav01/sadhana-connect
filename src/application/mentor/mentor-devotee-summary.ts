import type { DevoteeLastReportDate } from '@/domain/repositories/mentor-repository'
import type { MentorAssignedDevotee } from '@/domain/entities/mentor-devotee'
import type { SadhanaReport } from '@/domain/entities/sadhana-report'

export interface MentorDevoteeSummary {
  devoteeId: string
  fullName: string
  assignedAt: string
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
  recentReports: SadhanaReport[],
  lastReportDates: DevoteeLastReportDate[],
  today: string,
): MentorDevoteeSummary[] {
  const todayReportByDevotee = new Map(
    recentReports
      .filter((report) => report.reportDate === today)
      .map((report) => [report.profileId, report]),
  )
  const lastReportDateByDevotee = new Map(
    lastReportDates.map((entry) => [entry.devoteeId, entry.lastReportDate]),
  )

  return devotees.map((devotee) => {
    const todayReport = todayReportByDevotee.get(devotee.devoteeId)

    return {
      devoteeId: devotee.devoteeId,
      fullName: devotee.fullName,
      assignedAt: devotee.assignedAt,
      hasSubmittedToday: todayReport !== undefined,
      todayTotalRounds: todayReport?.totalRounds ?? null,
      lastReportDate: lastReportDateByDevotee.get(devotee.devoteeId) ?? null,
    }
  })
}
