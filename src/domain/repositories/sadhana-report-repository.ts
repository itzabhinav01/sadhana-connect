import type { SadhanaReport } from '@/domain/entities/sadhana-report'

export interface UpsertSadhanaReportParams {
  reportDate: string
  roundsBefore430: number
  roundsTill7am: number
  lastRoundTime: string | null
  totalRounds: number
  readingMinutes: number
  bookName: string | null
  hearingMinutes: number
  speakerName: string | null
  sleepTime: string | null
  wakeTime: string | null
  dayRestMinutes: number
  totalRestMinutes: number
  officeGoingTime: string | null
  officeReturnTime: string | null
  notes: string | null
  signatureText: string
}

export interface SadhanaReportRepository {
  // Returns null when the devotee has not submitted a report for this
  // date yet — the normal "haven't filled today" state, not an error.
  getReportByDate(
    profileId: string,
    reportDate: string,
  ): Promise<SadhanaReport | null>

  // Upserts on (profile_id, report_date) — the same call handles both
  // first-time submission and editing an existing report.
  upsertReport(
    profileId: string,
    params: UpsertSadhanaReportParams,
  ): Promise<SadhanaReport>

  // Inclusive date range, ordered by report_date ascending — used to
  // build the weekly summary/chart. Gap days (no report) are simply
  // absent from the result; the caller fills them in, never this layer.
  listReportsInRange(
    profileId: string,
    startDate: string,
    endDate: string,
  ): Promise<SadhanaReport[]>

  // Most recent reports regardless of gaps, newest first — used for both
  // the "recent reports" list and the streak calculation.
  listRecentReports(
    profileId: string,
    limit: number,
  ): Promise<SadhanaReport[]>
}
