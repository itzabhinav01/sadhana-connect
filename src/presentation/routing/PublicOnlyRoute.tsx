import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@sadhana-connect/auth'

// Redirects an already-authenticated session away from login/register/
// forgot-password back to "/". Deliberately not used on /reset-password,
// /auth/confirm, or /check-email — the password-recovery flow establishes a
// temporary session on /reset-password that must not be redirected away.
export function PublicOnlyRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
