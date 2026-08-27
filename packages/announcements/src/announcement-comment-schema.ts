import { z } from 'zod'

// Mirrors announcement_comments_text_max_length (0011) exactly, same
// rationale as ANNOUNCEMENT_TITLE_MAX_LENGTH: the authoritative bound is
// the DB CHECK constraint, this is a friendly-UX mirror of it.
export const ANNOUNCEMENT_COMMENT_MAX_LENGTH = 2000

export const announcementCommentSchema = z.object({
  commentText: z
    .string()
    .trim()
    .min(1, 'Comment is required.')
    .max(
      ANNOUNCEMENT_COMMENT_MAX_LENGTH,
      `Comment must be ${ANNOUNCEMENT_COMMENT_MAX_LENGTH} characters or fewer.`,
    ),
})

export type AnnouncementCommentFormValues = z.infer<typeof announcementCommentSchema>
