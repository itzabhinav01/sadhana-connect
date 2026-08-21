import { useNotifications } from '@/application/notifications/use-notifications'
import { Button } from '@/presentation/components/ui/button'
import { NotificationItem } from '@/presentation/pages/notifications/NotificationItem'

export function NotificationList() {
  const notificationsQuery = useNotifications()
  const notifications =
    notificationsQuery.data?.pages.flatMap((page) => page.notifications) ?? []

  return (
    <div className="flex flex-col gap-4">
      {notificationsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {notificationsQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your notifications. Please try again.
        </p>
      ) : null}

      {notificationsQuery.isSuccess && notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : null}

      {notifications.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border rounded-lg border">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationItem notification={notification} />
            </li>
          ))}
        </ul>
      ) : null}

      {notificationsQuery.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => notificationsQuery.fetchNextPage()}
          disabled={notificationsQuery.isFetchingNextPage}
          className="self-center"
        >
          {notificationsQuery.isFetchingNextPage ? 'Loading more…' : 'Load more'}
        </Button>
      ) : null}
    </div>
  )
}
