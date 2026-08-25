import { z } from 'zod'

// Mirrors sadhana_report_comments_text_max_length exactly (0004 migration).
export const COMMENT_MAX_LENGTH = 2000

export const commentSchema = z.object({
  commentText: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty.')
    .max(
      COMMENT_MAX_LENGTH,
      `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`,
    ),
})

export type CommentFormValues = z.infer<typeof commentSchema>
