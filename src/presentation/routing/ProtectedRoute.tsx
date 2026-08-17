import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/application/auth/use-auth'

// Authentication only — checks whether a session exists. Role-based
// authorization (Devotee/Mentor/Super Admin) belongs to Phase 4.
export function ProtectedRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
