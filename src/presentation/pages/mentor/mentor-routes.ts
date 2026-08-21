// Single dynamic-import entry point for the entire /mentor/* subtree
// (Phase 20 performance). router.tsx's route.lazy() calls all import
// from this one module, so Vite bundles every mentor page into one
// shared chunk that a devotee session never downloads — not three
// separate chunks, and not eagerly imported at all from router.tsx.
export { MentorDashboardPage } from '@/presentation/pages/mentor/MentorDashboardPage'
export { MentorDevoteeDetailPage } from '@/presentation/pages/mentor/MentorDevoteeDetailPage'
export { MentorAnnouncementsPage } from '@/presentation/pages/mentor/MentorAnnouncementsPage'
