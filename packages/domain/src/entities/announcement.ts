// Matches the announcements_scope_valid CHECK constraint from
// 0001_initial_schema exactly.
export type AnnouncementScope = 'all' | 'temple_group' | 'mentors' | 'devotees'

export interface Announcement {
  id: string
  authorId: string | null
  title: string
  content: string
  scope: AnnouncementScope
  templeGroupId: string | null
  isPublished: boolean
  publishedAt: string | null
  // NULL = permanent (Phase 20A). Non-null: hard-deleted once
  // expiresAt <= now() by the private.cleanup_expired_announcements()
  // pg_cron job (0011) — never soft-expired.
  expiresAt: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}
