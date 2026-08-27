import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useUnreadNotificationCount } from '@sadhana-connect/notifications'

// Devotee-only (see AppHeader) — the entry point to /notifications.
export function NotificationBell() {
  const unreadCountQuery = useUnreadNotificationCount()
  const unreadCount = unreadCountQuery.data ?? 0

  return (
    <Link
      to="/notifications"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
      className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Bell className="size-5" aria-hidden="true" />
      {unreadCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
