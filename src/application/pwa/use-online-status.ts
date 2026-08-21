import { useEffect, useState } from 'react'

// Drives the shared offline banner (AppLayout). navigator.onLine can
// false-positive as "online" on a captive portal / dead connection, but
// it's the only signal that doesn't require guessing at which network
// requests should be treated as connectivity probes — good enough for an
// honest "you're offline" indicator, not a claim about API reachability.
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
