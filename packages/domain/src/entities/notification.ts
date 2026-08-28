// Matches the notifications_type_valid CHECK constraint from
// 0001_initial_schema.sql (extended by 0017 for 'data_retention') exactly.
// 'system' is reserved for a future phase — no producer creates it yet.
export type NotificationType =
  | 'sadhana_reminder'
  | 'mentor_comment'
  | 'announcement'
  | 'system'
  | 'data_retention'

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
