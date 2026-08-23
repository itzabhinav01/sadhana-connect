// rounds_before_4_30am, rounds_till_7am, and total_rounds are independent
// values by design (approved product decision, Phase 6) — nothing here
// derives one from the others, and none of it is validated against the
// others. Same for day_rest_minutes vs total_rest_minutes.
export interface SadhanaReport {
  id: string
  profileId: string
  reportDate: string // 'YYYY-MM-DD'
  roundsBefore430: number
  roundsTill7am: number
  lastRoundTime: string | null // 'HH:mm'
  totalRounds: number
  readingMinutes: number
  bookName: string | null
  hearingMinutes: number
  speakerName: string | null
  sleepTime: string | null // 'HH:mm'
  wakeTime: string | null // 'HH:mm'
  dayRestMinutes: number
  totalRestMinutes: number
  officeGoingTime: string | null // 'HH:mm'
  officeReturnTime: string | null // 'HH:mm'
  notes: string | null
  signatureText: string
  createdAt: string
  updatedAt: string
}

// Narrow projections of SadhanaReport for views that only ever read a
// specific subset (Phase 20 performance) — declared explicitly here
// rather than derived via Pick<> so each repository method's return
// type states exactly what it fetches, keeping the contract honest
// about what's actually selected from the database.

// listReportsInRange's shape — shared by the devotee weekly dashboard
// chart and the Analytics page, neither of which reads anything beyond
// these six fields (see calculateWeeklySummary / calculateSadhanaAnalytics).
export interface SadhanaReportRangeSummary {
  reportDate: string
  totalRounds: number
  readingMinutes: number
  hearingMinutes: number
  dayRestMinutes: number
  totalRestMinutes: number
}

// Mentor listReportsForDevotees' shape — calculateMentorDevoteeSummaries
// only ever reads profileId/reportDate/totalRounds from these rows.
export interface MentorDevoteeReportSummary {
  profileId: string
  reportDate: string
  totalRounds: number
}

// listReportHistory's shape (Phase 20B) — backs DevoteeSadhanaHistorySection,
// used by both the Mentor devotee-detail page and the Admin devotee-detail
// view. Deliberately its own narrow projection rather than reusing
// SadhanaReportRangeSummary: that type's own selection is specifically
// traced/documented for the dashboard chart + Analytics page and omits
// `id`, which this view needs (to key the per-report comments toggle).
export interface SadhanaReportHistoryEntry {
  id: string
  reportDate: string
  totalRounds: number
  readingMinutes: number
  hearingMinutes: number
}
