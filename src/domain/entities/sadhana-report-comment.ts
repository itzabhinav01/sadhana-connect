// mentorName is a point-in-time snapshot captured at write time, not a
// live join to profiles — see 0004_sadhana_report_comments.sql for why.
export interface SadhanaReportComment {
  id: string
  sadhanaReportId: string
  mentorId: string
  mentorName: string
  commentText: string
  createdAt: string
  updatedAt: string
}
