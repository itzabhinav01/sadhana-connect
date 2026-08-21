import { useMarkAllNotificationsRead } from '@/application/notifications/use-mark-all-notifications-read'
import { useUnreadNotificationCount } from '@/application/notifications/use-unread-notification-count'
import { Button } from '@/presentation/components/ui/button'
import { NotificationList } from '@/presentation/pages/notifications/NotificationList'

export function NotificationsPage() {
  const unreadCountQuery = useUnreadNotificationCount()
  const markAllRead = useMarkAllNotificationsRead()
  const hasUnread = (unreadCountQuery.data ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Updates from your mentor and temple.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={!hasUnread || markAllRead.isPending}
        >
          {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
        </Button>
      </div>

      <NotificationList />
    </div>
  )
}
