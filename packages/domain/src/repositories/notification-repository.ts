import type { SadhanaNotification } from '../entities/notification'

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

  // Calls the public.send_reminder_notification() RPC (Phase 20B) — a
  // mentor may only target their own currently-assigned devotee, a
  // super_admin any devotee; both the authorization check and the
  // 2-per-24h rate limit are enforced entirely inside that
  // SECURITY DEFINER function, not by this layer (a mentor caller has no
  // RLS read access to another profile's notifications at all, so there
  // is no client-side precheck this layer could even perform). message
  // null/blank means "use the generic reminder text."
  sendReminderNotification(
    devoteeId: string,
    message: string | null,
  ): Promise<SadhanaNotification>
}
