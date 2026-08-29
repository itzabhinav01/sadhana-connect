import { useLocation } from 'react-router-dom'

import type { Profile } from '@sadhana-connect/domain/entities/profile'
import type { NavItem } from '@/presentation/navigation/nav-config'
import { getBottomTabItemsForRole } from '@/presentation/navigation/nav-config'
import { AccountMenu } from '@/presentation/layouts/AccountMenu'
import { MobileNav } from '@/presentation/layouts/MobileNav'
import { NotificationBell } from '@/presentation/layouts/NotificationBell'
import { ThemeToggle } from '@/presentation/layouts/ThemeToggle'

interface AppHeaderProps {
  navItems: NavItem[]
  profile: Profile
  email: string | null
}

function useCurrentPageTitle(navItems: NavItem[]) {
  const { pathname } = useLocation()

  return navItems.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  )?.label
}

export function AppHeader({ navItems, profile, email }: AppHeaderProps) {
  const pageTitle = useCurrentPageTitle(navItems)
  // Roles with a bottom tab bar (devotee, mentor) get their primary nav
  // there instead — the hamburger/drawer only remains for roles without
  // one (super_admin), matching the mobile app's same admin-keeps-a-full
  // menu decision.
  const hasBottomTabs = getBottomTabItemsForRole(profile.role) !== null

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      {hasBottomTabs ? null : <MobileNav items={navItems} />}
      <span className="text-base font-semibold md:hidden">
        Sadhana Connect
      </span>
      {pageTitle ? (
        <h1 className="hidden text-sm font-medium text-foreground md:block">
          {pageTitle}
        </h1>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        {profile.role === 'devotee' ? <NotificationBell /> : null}
        <ThemeToggle />
        <AccountMenu
          fullName={profile.fullName}
          email={email}
          role={profile.role}
        />
      </div>
    </header>
  )
}
