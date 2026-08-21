import { z } from 'zod'

// Mirror announcements_title_max_length / announcements_content_max_length
// exactly (0009_announcement_length_limits) — Phase 19 security hardening.
// Published announcements are fanned out to one notifications row per
// matching devotee (notify_on_announcement_published, 0007) with title/
// content copied in full and no truncation, so an unbounded value here
// amplifies storage across every recipient. 200/5000 are generous for a
// devotional announcement headline/body while keeping that amplification
// bounded — not an arbitrary pick, see the migration's own comment.
export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 200
export const ANNOUNCEMENT_CONTENT_MAX_LENGTH = 5000

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(
      ANNOUNCEMENT_TITLE_MAX_LENGTH,
      `Title must be ${ANNOUNCEMENT_TITLE_MAX_LENGTH} characters or fewer.`,
    ),
  content: z
    .string()
    .trim()
    .min(1, 'Content is required.')
    .max(
      ANNOUNCEMENT_CONTENT_MAX_LENGTH,
      `Content must be ${ANNOUNCEMENT_CONTENT_MAX_LENGTH} characters or fewer.`,
    ),
})

export type AnnouncementFormValues = z.infer<typeof announcementSchema>
