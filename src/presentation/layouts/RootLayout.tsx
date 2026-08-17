import { Outlet } from 'react-router-dom'

// The single top-level element the router mounts. Kept intentionally
// thin — it exists as the composition point for cross-cutting UI (e.g. a
// future global toaster or error boundary) without requiring another
// change to the route tree when that's added.
export function RootLayout() {
  return <Outlet />
}
