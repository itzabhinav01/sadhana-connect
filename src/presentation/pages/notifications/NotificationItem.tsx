import { useState } from 'react'

import { useMarkNotificationRead } from '@/application/notifications/use-mark-notification-read'
import { useNotificationNavigation } from '@/application/notifications/use-notification-navigation'
import type { SadhanaNotification } from '@/domain/entities/notification'
import { cn } from '@/shared/utils/cn'

function formatNotificationDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

interface NotificationItemProps {
  notification: SadhanaNotification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markRead = useMarkNotificationRead()
  const navigateToNotification = useNotificationNavigation()
  const [isNavigating, setIsNavigating] = useState(false)

  async function handleClick() {
    if (!notification.isRead) {
      markRead.mutate(notification.id)
    }
    setIsNavigating(true)
    try {
      await navigateToNotification(notification)
    } finally {
      setIsNavigating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isNavigating}
      aria-label={notification.isRead ? notification.title : `Unread: ${notification.title}`}
      className={cn(
        'flex w-full flex-col gap-1 px-4 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70',
        !notification.isRead && 'bg-accent/40',
      )}
    >
      <div className="flex items-center gap-2">
        {!notification.isRead ? (
          <span
            className="size-2 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
        ) : null}
        <span
          className={cn(
            'text-sm text-foreground',
            !notification.isRead && 'font-semibold',
          )}
        >
          {notification.title}
        </span>
      </div>
      {notification.body ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {notification.body}
        </p>
      ) : null}
      <span className="text-xs text-muted-foreground">
        {formatNotificationDate(notification.createdAt)}
      </span>
    </button>
  )
}
