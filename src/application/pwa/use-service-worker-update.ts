import { useContext } from 'react'

import { ServiceWorkerUpdateContext } from '@/application/pwa/service-worker-update-context'

export function useServiceWorkerUpdate() {
  const context = useContext(ServiceWorkerUpdateContext)
  if (!context) {
    throw new Error(
      'useServiceWorkerUpdate must be used within a ServiceWorkerUpdateProvider',
    )
  }
  return context
}
