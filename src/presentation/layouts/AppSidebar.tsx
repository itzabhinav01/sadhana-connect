import type { NavItem } from '@/presentation/navigation/nav-config'
import { NavLinks } from '@/presentation/layouts/NavLinks'

interface AppSidebarProps {
  items: NavItem[]
}

// Persistent desktop sidebar. Hidden entirely (not just visually) below
// md, so its nav landmark never competes with the mobile drawer's.
export function AppSidebar({ items }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">Sadhana Connect</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks items={items} />
      </div>
    </aside>
  )
}
