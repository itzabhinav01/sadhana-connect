import {
  BarChart3,
  BookOpen,
  Hand,
  History,
  Home,
  Megaphone,
  NotebookPen,
  Settings,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { AppRole } from '@/domain/entities/profile'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

// `common` items are visible to every authenticated role. `byRole` lists
// are populated in later phases (Devotee dashboard items — Phase 7,
// Mentor dashboard — Phase 12, Super Admin — Phase 14); the per-role
// structure exists now so those phases only add data here, not new
// plumbing.
export const navigationConfig: {
  common: NavItem[]
  byRole: Record<AppRole, NavItem[]>
} = {
  common: [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  byRole: {
    devotee: [
      { label: 'Sadhana', href: '/sadhana', icon: NotebookPen },
      { label: 'History', href: '/history', icon: History },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Japa Counter', href: '/japa', icon: Hand },
      { label: 'Verse of the Day', href: '/verse-of-the-day', icon: BookOpen },
    ],
    mentor: [
      { label: 'Mentor Dashboard', href: '/mentor', icon: Users },
      { label: 'Announcements', href: '/mentor/announcements', icon: Megaphone },
    ],
    super_admin: [],
  },
}

// UI convenience only — which links render for a role. Not an
// authorization check: every route these links point to is (or will be)
// independently protected by RLS and, where needed, RequireRole.
export function getNavItemsForRole(role: AppRole | undefined): NavItem[] {
  if (!role) return []
  return [...navigationConfig.common, ...navigationConfig.byRole[role]]
}
