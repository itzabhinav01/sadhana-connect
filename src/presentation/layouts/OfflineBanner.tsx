import { WifiOff } from 'lucide-react'

import { useOnlineStatus } from '@/application/pwa/use-online-status'

// Single shared indicator, rendered once at the AppLayout level — not
// per-page. Never claims Sadhana data or writes are usable offline, only
// that connectivity is currently unavailable.
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b bg-muted px-4 py-2 text-sm text-muted-foreground"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <span>
        You&apos;re offline — some features aren&apos;t available until you
        reconnect.
      </span>
    </div>
  )
}
