import { NavLink } from 'react-router-dom'

import type { NavItem } from '@/presentation/navigation/nav-config'
import { cn } from '@/shared/utils/cn'

interface BottomTabBarProps {
  items: NavItem[]
}

// The narrow-viewport (<md) primary navigation for roles that have a
// bottom-tab set (see getBottomTabItemsForRole) — replaces the hamburger
// drawer for those roles; Profile/Settings/Sign out live in the header's
// account menu instead. Hidden at md and above, where AppSidebar already
// covers the same destinations.
export function BottomTabBar({ items }: BottomTabBarProps) {
  return (
    <nav
      aria-label="Primary tabs"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-background md:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              isActive && 'text-primary',
            )
          }
        >
          <item.icon className="size-5 shrink-0" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
