import { describe, expect, it } from 'vitest'

import {
  ANNOUNCEMENT_COMMENT_MAX_LENGTH,
  announcementCommentSchema,
} from '@/application/announcements/announcement-comment-schema'

describe('announcementCommentSchema', () => {
  it('accepts a normal comment', () => {
    const result = announcementCommentSchema.safeParse({ commentText: 'When does this start?' })
    expect(result.success).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    const result = announcementCommentSchema.safeParse({ commentText: '  Hi there  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.commentText).toBe('Hi there')
    }
  })

  it('rejects an empty comment', () => {
    const result = announcementCommentSchema.safeParse({ commentText: '   ' })
    expect(result.success).toBe(false)
  })

  it(`rejects a comment longer than ${ANNOUNCEMENT_COMMENT_MAX_LENGTH} characters`, () => {
    const result = announcementCommentSchema.safeParse({
      commentText: 'a'.repeat(ANNOUNCEMENT_COMMENT_MAX_LENGTH + 1),
    })
    expect(result.success).toBe(false)
  })

  it(`accepts a comment exactly ${ANNOUNCEMENT_COMMENT_MAX_LENGTH} characters long`, () => {
    const result = announcementCommentSchema.safeParse({
      commentText: 'a'.repeat(ANNOUNCEMENT_COMMENT_MAX_LENGTH),
    })
    expect(result.success).toBe(true)
  })
})
