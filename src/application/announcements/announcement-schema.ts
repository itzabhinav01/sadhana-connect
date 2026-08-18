import { z } from 'zod'

// Mirrors announcements_title_not_blank / announcements_content_not_blank
// exactly (0001_initial_schema) — no maximum length is imposed here
// because the database itself imposes none; inventing a client-only cap
// that doesn't match the actual constraint would be misleading.
export const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  content: z.string().trim().min(1, 'Content is required.'),
})

export type AnnouncementFormValues = z.infer<typeof announcementSchema>
