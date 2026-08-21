import { useServiceWorkerUpdate } from '@/application/pwa/use-service-worker-update'
import { Button } from '@/presentation/components/ui/button'

// Shown when a new service worker version is waiting to activate.
// Refresh is always an explicit click — never automatic — so an
// in-progress Sadhana form is never silently discarded by a background
// update.
export function UpdatePrompt() {
  const { needRefresh, refresh, dismiss } = useServiceWorkerUpdate()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-2 text-sm text-card-foreground"
    >
      <span>A new version is available — Refresh</span>
      <div className="flex gap-2">
        <Button size="sm" onClick={refresh}>
          Refresh
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={dismiss}
          aria-label="Dismiss update notice"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
