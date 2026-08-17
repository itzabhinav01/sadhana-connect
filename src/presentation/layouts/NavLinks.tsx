import { NavLink } from 'react-router-dom'

import type { NavItem } from '@/presentation/navigation/nav-config'
import { cn } from '@/shared/utils/cn'

interface NavLinksProps {
  items: NavItem[]
  onNavigate?: () => void
  className?: string
}

export function NavLinks({ items, onNavigate, className }: NavLinksProps) {
  return (
    <nav aria-label="Primary" className={cn('flex flex-col gap-1', className)}>
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
              isActive && 'bg-accent text-accent-foreground',
            )
          }
        >
          <item.icon className="size-4 shrink-0" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
