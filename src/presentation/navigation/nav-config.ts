import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  Hand,
  History,
  Home,
  LayoutDashboard,
  Megaphone,
  NotebookPen,
  Settings,
  User,
  UserCog,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { AppRole } from '@sadhana-connect/domain/entities/profile'

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
      { label: 'Announcements', href: '/announcements', icon: Megaphone },
      { label: 'Japa Counter', href: '/japa', icon: Hand },
      { label: 'Verse of the Day', href: '/verse-of-the-day', icon: BookOpen },
    ],
    mentor: [
      { label: 'Mentor Dashboard', href: '/mentor', icon: Users },
      { label: 'Announcements', href: '/mentor/announcements', icon: Megaphone },
    ],
    super_admin: [
      { label: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Mentors', href: '/admin/mentors', icon: UserCog },
      { label: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
      { label: 'Temple Groups', href: '/admin/temple-groups', icon: Building2 },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    ],
  },
}

// UI convenience only — which links render for a role. Not an
// authorization check: every route these links point to is (or will be)
// independently protected by RLS and, where needed, RequireRole.
export function getNavItemsForRole(role: AppRole | undefined): NavItem[] {
  if (!role) return []
  return [...navigationConfig.common, ...navigationConfig.byRole[role]]
}

// The primary-destination subset shown as a persistent bottom tab bar on
// narrow viewports (mirrors the tab bar already shipped on apps/mobile —
// same devotee 5 items, same rationale: thumb-reach for the handful of
// destinations visited every day, no drawer tap required). Profile and
// Settings stay reachable via the header's account menu instead, same
// split as mobile. super_admin has no bottom-tab set — its 6-item nav is
// deliberately left on the existing hamburger/drawer, matching the
// decision already made for the mobile app's admin role.
export function getBottomTabItemsForRole(role: AppRole | undefined): NavItem[] | null {
  if (role === 'devotee') {
    return [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Sadhana', href: '/sadhana', icon: NotebookPen },
      { label: 'History', href: '/history', icon: History },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Alerts', href: '/notifications', icon: Bell },
    ]
  }
  if (role === 'mentor') {
    return [
      { label: 'Devotees', href: '/mentor', icon: Users },
      { label: 'Announcements', href: '/mentor/announcements', icon: Megaphone },
    ]
  }
  return null
}
