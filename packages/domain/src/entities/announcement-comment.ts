// authorName is a point-in-time snapshot captured at write time, not a
// live join to profiles — same rationale as SadhanaReportComment.mentorName
// (see 0004_sadhana_report_comments.sql). Flat/non-nested by design: no
// parentCommentId (approved Phase 20A decision — no threaded replies).
export interface AnnouncementComment {
  id: string
  announcementId: string
  authorId: string
  authorName: string
  commentText: string
  createdAt: string
  updatedAt: string
}
