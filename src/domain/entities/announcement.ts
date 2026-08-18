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
  createdAt: string
  updatedAt: string
}
