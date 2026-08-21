import type { SadhanaNotification } from '@/domain/entities/notification'

// Compound keyset cursor — a single set-based announcement fan-out
// inserts many rows sharing the exact same created_at (one `now()` per
// SQL statement), so created_at alone cannot serve as a unique cursor.
// id (uuid) breaks ties deterministically.
export interface NotificationListCursor {
  createdAt: string
  id: string
}

export interface ListNotificationsOptions {
  limit: number
  cursor?: NotificationListCursor | null
}

export interface ListNotificationsResult {
  notifications: SadhanaNotification[]
  nextCursor: NotificationListCursor | null
}

export interface NotificationRepository {
  // Newest-first, keyset-paginated. RLS (notifications_select) is the
  // real authorization boundary — recipientId is passed as-is, matching
  // every other repository in this codebase.
  listNotifications(
    recipientId: string,
    options: ListNotificationsOptions,
  ): Promise<ListNotificationsResult>

  countUnread(recipientId: string): Promise<number>

  // Ownership is enforced by RLS (notifications_update), not by this
  // layer — same pattern as SadhanaReportCommentRepository.updateComment.
  markRead(notificationId: string): Promise<void>

  markAllRead(recipientId: string): Promise<void>
}
