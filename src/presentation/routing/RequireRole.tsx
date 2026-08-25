import { Navigate, Outlet } from 'react-router-dom'

import type { AppRole } from '@sadhana-connect/domain/entities/profile'
import { useProfile } from '@sadhana-connect/auth'

interface RequireRoleProps {
  allow: AppRole[]
}

// A UX/navigation guard only — not a security boundary. Meant to be
// nested inside ProtectedRoute, which has already resolved the
// loading/error/disabled-account states, so this only branches on role.
// The real enforcement for whatever data these routes render is RLS.
export function RequireRole({ allow }: RequireRoleProps) {
  const profile = useProfile()

  if (!profile.data || !allow.includes(profile.data.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
