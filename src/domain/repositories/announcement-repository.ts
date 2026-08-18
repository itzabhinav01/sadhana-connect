import type { Announcement, AnnouncementScope } from '@/domain/entities/announcement'

export interface CreateAnnouncementParams {
  authorId: string
  title: string
  content: string
  scope: AnnouncementScope
  templeGroupId: string | null
  isPublished: boolean
}

export interface UpdateAnnouncementParams {
  title: string
  content: string
  isPublished: boolean
}

export interface AnnouncementRepository {
  // RLS (announcements_select) is the real authorization boundary — this
  // method takes no viewer/role parameter at all, because none is needed:
  // the query is identical for every caller, and Postgres decides what
  // comes back.
  listVisibleAnnouncements(): Promise<Announcement[]>

  // Generic at this layer — scope is a caller-supplied value, not
  // hardcoded here. The "mentors may only use scope: 'temple_group'"
  // rule lives in the application layer (useCreateMentorAnnouncement),
  // not this repository, so this interface stays reusable for a future
  // Super Admin authoring flow. RLS (announcements_insert /
  // private.can_publish_announcement) is what actually enforces the rule
  // regardless of what any caller sends.
  createAnnouncement(params: CreateAnnouncementParams): Promise<Announcement>

  updateAnnouncement(
    id: string,
    params: UpdateAnnouncementParams,
  ): Promise<Announcement>

  deleteAnnouncement(id: string): Promise<void>
}
