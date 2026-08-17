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
}
