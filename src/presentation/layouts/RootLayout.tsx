import { Outlet } from 'react-router-dom'

import { ErrorBoundary } from '@/presentation/components/ErrorBoundary'

// The single top-level element the router mounts. Kept intentionally
// thin — it exists as the composition point for cross-cutting UI (e.g. a
// future global toaster) without requiring another change to the route
// tree when that's added.
export function RootLayout() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}
