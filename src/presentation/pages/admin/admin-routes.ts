// Single dynamic-import entry point for the entire /admin/* subtree
// (Phase 20 performance). router.tsx's route.lazy() calls all import
// from this one module, so Vite bundles every admin page into one
// shared chunk that a devotee/mentor session never downloads — not
// seven separate chunks, and not eagerly imported at all from router.tsx.
export { AdminDashboardPage } from '@/presentation/pages/admin/AdminDashboardPage'
export { AdminUsersPage } from '@/presentation/pages/admin/AdminUsersPage'
export { AdminUserDetailPage } from '@/presentation/pages/admin/AdminUserDetailPage'
export { AdminMentorsPage } from '@/presentation/pages/admin/AdminMentorsPage'
export { AdminAssignmentsPage } from '@/presentation/pages/admin/AdminAssignmentsPage'
export { AdminTempleGroupsPage } from '@/presentation/pages/admin/AdminTempleGroupsPage'
export { AdminAnnouncementsPage } from '@/presentation/pages/admin/AdminAnnouncementsPage'
