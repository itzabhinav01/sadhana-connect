import { Menu } from 'lucide-react'
import { useState } from 'react'

import type { NavItem } from '@/presentation/navigation/nav-config'
import { Button } from '@/presentation/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/presentation/components/ui/sheet'
import { NavLinks } from '@/presentation/layouts/NavLinks'

interface MobileNavProps {
  items: NavItem[]
}

// Radix's Dialog primitive (which Sheet wraps) already provides the focus
// trap, Escape-to-close, and aria-modal semantics a nav drawer needs.
export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
          aria-expanded={open}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Sadhana Connect</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          <NavLinks items={items} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
