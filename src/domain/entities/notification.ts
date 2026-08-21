// Matches the notifications_type_valid CHECK constraint from
// 0001_initial_schema.sql exactly. 'sadhana_reminder' and 'system' are
// reserved for a future phase — no producer creates them yet (Phase 17
// v1 only implements 'mentor_comment' and 'announcement').
export type NotificationType =
  | 'sadhana_reminder'
  | 'mentor_comment'
  | 'announcement'
  | 'system'

// Named SadhanaNotification (not `Notification`) to avoid shadowing the
// global Web Notifications API type of the same name.
export interface SadhanaNotification {
  id: string
  recipientId: string
  type: NotificationType
  title: string
  body: string | null
  relatedAnnouncementId: string | null
  relatedReportId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}
