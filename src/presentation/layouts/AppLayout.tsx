import { Outlet } from 'react-router-dom'

import { useAuth } from '@/application/auth/use-auth'
import { useNotificationsRealtime } from '@/application/notifications/use-notifications-realtime'
import { useProfile } from '@/application/profile/use-profile'
import { getNavItemsForRole } from '@/presentation/navigation/nav-config'
import { AppHeader } from '@/presentation/layouts/AppHeader'
import { AppSidebar } from '@/presentation/layouts/AppSidebar'

// Rendered only inside ProtectedRoute's <Outlet/>, which has already
// resolved the auth-loading, profile-loading, profile-error, and
// disabled-account states before this mounts — profile.data is guaranteed
// present and active here. The null guard below is defensive, not a state
// this component is meant to render for.
export function AppLayout() {
  const { session } = useAuth()
  const profile = useProfile()
  // Runs for the whole authenticated session (not just while on
  // /notifications) so the header badge stays live wherever the devotee
  // is — internally a no-op for non-devotee roles (see the hook's own
  // doc comment).
  useNotificationsRealtime()

  if (!profile.data) {
    return null
  }

  const navItems = getNavItemsForRole(profile.data.role)

  return (
    <div className="flex min-h-svh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <AppSidebar items={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          navItems={navItems}
          profile={profile.data}
          email={session?.email ?? null}
        />
        <main
          id="main-content"
          className="flex-1 overflow-x-hidden p-4 md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
