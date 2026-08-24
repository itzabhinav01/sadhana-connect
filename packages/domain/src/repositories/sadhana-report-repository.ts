import type {
  SadhanaReport,
  SadhanaReportHistoryEntry,
  SadhanaReportRangeSummary,
} from '@sadhana-connect/domain/entities/sadhana-report'

export interface ListSadhanaReportsOptions {
  fromDate?: string
  toDate?: string
  limit: number
  // Last-seen report_date from the previous page. null/undefined = first
  // page. report_date is unique per profile (the DB unique constraint),
  // so it alone is a valid keyset cursor — no secondary tie-break needed.
  cursor?: string | null
}

export interface ListSadhanaReportsResult {
  reports: SadhanaReport[]
  // Present iff there is a next page — pass this back as `cursor` to
  // fetch it. null means this was the last page.
  nextCursor: string | null
}

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

  // Resolves just the report_date for a known report id — used to build
  // the /sadhana?date=... deep link from a mentor_comment notification's
  // related_report_id (a uuid; the devotee-facing Sadhana route is
  // date-addressed, not id-addressed). Returns null if the id doesn't
  // resolve to a report this caller can read (RLS-enforced, same as
  // every other method here) — the notification link falls back
  // gracefully rather than erroring.
  getReportDateById(reportId: string): Promise<string | null>

  // Upserts on (profile_id, report_date) — the same call handles both
  // first-time submission and editing an existing report.
  upsertReport(
    profileId: string,
    params: UpsertSadhanaReportParams,
  ): Promise<SadhanaReport>

  // Inclusive date range, ordered by report_date ascending — used to
  // build the weekly summary/chart AND the Analytics page (same method,
  // different range). Gap days (no report) are simply absent from the
  // result; the caller fills them in, never this layer. Narrowed
  // (Phase 20) to exactly the fields calculateWeeklySummary /
  // calculateSadhanaAnalytics read — traced, not guessed.
  listReportsInRange(
    profileId: string,
    startDate: string,
    endDate: string,
  ): Promise<SadhanaReportRangeSummary[]>

  // Most recent reports regardless of gaps, newest first — used for both
  // the "recent reports" list and the streak calculation.
  listRecentReports(
    profileId: string,
    limit: number,
  ): Promise<SadhanaReport[]>

  // Paginated (keyset/cursor), optionally date-filtered, newest first —
  // used by the History page. Unlike listReportsInRange, this is safe to
  // call over an arbitrary/unbounded date span since it never returns
  // more than `limit` rows.
  listReports(
    profileId: string,
    options: ListSadhanaReportsOptions,
  ): Promise<ListSadhanaReportsResult>

  // Inclusive date range, ordered by report_date ascending — backs
  // DevoteeSadhanaHistorySection (Phase 20B: mentor/admin devotee
  // oversight). RLS (sadhana_reports_select's is_mentor_of()/
  // is_super_admin() branches) is what actually authorizes a
  // mentor/admin caller to read another profile's reports; profileId is
  // passed as-is, same convention as every other method here.
  listReportHistory(
    profileId: string,
    startDate: string,
    endDate: string,
  ): Promise<SadhanaReportHistoryEntry[]>
}
