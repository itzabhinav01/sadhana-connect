import { describe, expect, it } from 'vitest'

import { COMMENT_MAX_LENGTH, commentSchema } from '@/application/comments/comment-schema'

describe('commentSchema', () => {
  it('accepts a normal comment', () => {
    const result = commentSchema.safeParse({ commentText: 'Great effort today!' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty comment', () => {
    const result = commentSchema.safeParse({ commentText: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a whitespace-only comment', () => {
    const result = commentSchema.safeParse({ commentText: '   ' })
    expect(result.success).toBe(false)
  })

  it('trims surrounding whitespace', () => {
    const result = commentSchema.safeParse({ commentText: '  Nice work  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.commentText).toBe('Nice work')
    }
  })

  it(`accepts exactly ${COMMENT_MAX_LENGTH} characters`, () => {
    const result = commentSchema.safeParse({ commentText: 'a'.repeat(COMMENT_MAX_LENGTH) })
    expect(result.success).toBe(true)
  })

  it(`rejects ${COMMENT_MAX_LENGTH + 1} characters`, () => {
    const result = commentSchema.safeParse({ commentText: 'a'.repeat(COMMENT_MAX_LENGTH + 1) })
    expect(result.success).toBe(false)
  })
})
