import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/application/auth/use-auth'
import { useProfile } from '@/application/profile/use-profile'
import { AccountDisabledPage } from '@/presentation/pages/AccountDisabledPage'

function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}

// Authentication (is there a session?) plus a UX-level authorization
// gate (is this profile active?). Neither check is a security boundary —
// every table this profile's role/is_active might gate is independently
// enforced by RLS regardless of what this component decides to render.
export function ProtectedRoute() {
  const { session, isLoading: isSessionLoading } = useAuth()
  const profile = useProfile()

  if (isSessionLoading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile.isPending) {
    return <LoadingScreen />
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-sm text-destructive">
          Something went wrong loading your profile. Please try again.
        </p>
      </div>
    )
  }

  if (!profile.data.isActive) {
    return <AccountDisabledPage />
  }

  return <Outlet />
}
