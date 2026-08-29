import { Archive, Bell, MessageCircle, Megaphone } from 'lucide-react'
import { useState } from 'react'

import { useMarkNotificationRead } from '@sadhana-connect/notifications'
import { useNotificationNavigation } from '@/application/notifications/use-notification-navigation'
import type { SadhanaNotification } from '@sadhana-connect/domain/entities/notification'
import { formatDateLong } from '@sadhana-connect/shared'
import { cn } from '@/shared/utils/cn'

function formatNotificationDate(iso: string) {
  const date = new Date(iso)
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${formatDateLong(date)}, ${time}`
}

// One icon per notification type — same choices as apps/mobile's
// NOTIFICATION_TYPE_ICON, so the two platforms read as the same product.
const TYPE_ICON: Record<SadhanaNotification['type'], typeof Bell> = {
  mentor_comment: MessageCircle,
  announcement: Megaphone,
  sadhana_reminder: Bell,
  data_retention: Archive,
  system: Bell,
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

  const TypeIcon = TYPE_ICON[notification.type]

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isNavigating}
      aria-label={notification.isRead ? notification.title : `Unread: ${notification.title}`}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70',
        !notification.isRead && 'bg-accent/40',
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <TypeIcon className="size-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm text-foreground',
              !notification.isRead && 'font-semibold',
            )}
          >
            {notification.title}
          </span>
          {!notification.isRead ? (
            <span
              className="size-2 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
          ) : null}
        </div>
        {notification.body ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {notification.body}
          </p>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {formatNotificationDate(notification.createdAt)}
        </span>
      </div>
    </button>
  )
}
