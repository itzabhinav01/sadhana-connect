import { Outlet, useNavigation } from 'react-router-dom'

import { useAuth } from '@/application/auth/use-auth'
import { useNotificationsRealtime } from '@/application/notifications/use-notifications-realtime'
import { useProfile } from '@/application/profile/use-profile'
import { getNavItemsForRole } from '@/presentation/navigation/nav-config'
import { AppHeader } from '@/presentation/layouts/AppHeader'
import { AppSidebar } from '@/presentation/layouts/AppSidebar'
import { OfflineBanner } from '@/presentation/layouts/OfflineBanner'
import { UpdatePrompt } from '@/presentation/layouts/UpdatePrompt'

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
  // 'loading' only while react-router awaits a route's lazy() chunk
  // fetch (Phase 20 — /mentor/* and /admin/* are the only lazy routes;
  // every other route here has no loader/lazy, so this never flashes
  // for a normal navigation between them).
  const navigation = useNavigation()
  const isRouteChunkLoading = navigation.state === 'loading'

  if (!profile.data) {
    return null
  }

  const navItems = getNavItemsForRole(profile.data.role)

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <OfflineBanner />
      <UpdatePrompt />
      <div className="flex min-h-0 flex-1">
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
            {isRouteChunkLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-40 items-center justify-center"
              >
                <p className="text-sm text-muted-foreground">Loading…</p>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
