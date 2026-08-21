import { createContext } from 'react'

export interface ServiceWorkerUpdateContextValue {
  // True once a new service worker version has installed and is waiting
  // to activate (registerType: 'prompt' — it never activates itself).
  needRefresh: boolean
  // Explicit user action only: skipWaiting + reload. Never called
  // automatically, so an in-progress Sadhana form is never discarded.
  refresh: () => void
  dismiss: () => void
}

export const ServiceWorkerUpdateContext = createContext<
  ServiceWorkerUpdateContextValue | undefined
>(undefined)
