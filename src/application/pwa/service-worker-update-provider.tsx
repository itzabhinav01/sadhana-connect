import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { registerSW } from 'virtual:pwa-register'

import { ServiceWorkerUpdateContext } from '@/application/pwa/service-worker-update-context'

// Registers the service worker exactly once, at the app root — not
// gated behind authentication, so an anonymous visitor on /login also
// gets the installable app shell and its offline/update behavior, not
// just a logged-in devotee. Wrapped once in AppProviders; UpdatePrompt
// (AppLayout) consumes the resulting state via useServiceWorkerUpdate()
// rather than registering a second time.
export function ServiceWorkerUpdateProvider({
  children,
}: {
  children: ReactNode
}) {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateServiceWorkerRef = useRef<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null)

  useEffect(() => {
    // Production only — local `npm run dev` must never register a
    // service worker (devOptions.enabled: false in vite.config.ts
    // already prevents one from being built for dev; this is a second,
    // explicit guard against ever calling registerSW() there).
    if (!import.meta.env.PROD) return

    updateServiceWorkerRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true)
      },
    })
  }, [])

  function refresh() {
    void updateServiceWorkerRef.current?.(true)
  }

  function dismiss() {
    setNeedRefresh(false)
  }

  return (
    <ServiceWorkerUpdateContext.Provider
      value={{ needRefresh, refresh, dismiss }}
    >
      {children}
    </ServiceWorkerUpdateContext.Provider>
  )
}
