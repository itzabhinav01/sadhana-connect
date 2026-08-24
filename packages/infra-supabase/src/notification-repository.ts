import type {
  NotificationType,
  SadhanaNotification,
} from '@sadhana-connect/domain/entities/notification'
import type {
  ListNotificationsOptions,
  ListNotificationsResult,
  NotificationRepository,
} from '@sadhana-connect/domain/repositories/notification-repository'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase/client'

interface NotificationRow {
  id: string
  recipient_id: string
  type: NotificationType
  title: string
  body: string | null
  related_announcement_id: string | null
  related_report_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  'id, recipient_id, type, title, body, related_announcement_id, related_report_id, is_read, read_at, created_at, updated_at'

function mapRow(row: NotificationRow): SadhanaNotification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type,
    title: row.title,
    body: row.body,
    relatedAnnouncementId: row.related_announcement_id,
    relatedReportId: row.related_report_id,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const supabaseNotificationRepository: NotificationRepository = {
  async listNotifications(
    recipientId,
    options: ListNotificationsOptions,
  ): Promise<ListNotificationsResult> {
    let query = getSupabaseClient()
      .from('notifications')
      .select(SELECT_COLUMNS)
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(options.limit + 1)

    if (options.cursor) {
      // Strictly-older-than-cursor, tie-broken by id — see
      // NotificationListCursor's own doc comment for why created_at
      // alone is not safe here.
      const { createdAt, id } = options.cursor
      query = query.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      )
    }

    const { data, error } = await query

    if (error) throw error

    const rows = (data as NotificationRow[]).map(mapRow)
    const hasNextPage = rows.length > options.limit
    const notifications = hasNextPage ? rows.slice(0, options.limit) : rows
    const last = notifications[notifications.length - 1]
    const nextCursor =
      hasNextPage && last ? { createdAt: last.createdAt, id: last.id } : null

    return { notifications, nextCursor }
  },

  async countUnread(recipientId) {
    const { count, error } = await getSupabaseClient()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .eq('is_read', false)

    if (error) throw error

    return count ?? 0
  },

  async markRead(notificationId) {
    const { error } = await getSupabaseClient()
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
  },

  async markAllRead(recipientId) {
    const { error } = await getSupabaseClient()
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', recipientId)
      .eq('is_read', false)

    if (error) throw error
  },

  async sendReminderNotification(devoteeId, message) {
    const { data, error } = await getSupabaseClient().rpc('send_reminder_notification', {
      p_devotee_id: devoteeId,
      p_message: message,
    })

    if (error) throw error

    return mapRow(data as NotificationRow)
  },
}
