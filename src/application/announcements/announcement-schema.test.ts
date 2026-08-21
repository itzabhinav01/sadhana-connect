import { describe, expect, it } from 'vitest'

import {
  ANNOUNCEMENT_CONTENT_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
  announcementSchema,
} from '@/application/announcements/announcement-schema'

describe('announcementSchema', () => {
  it('accepts a normal announcement', () => {
    const result = announcementSchema.safeParse({
      title: 'Temple closed for renovation',
      content: 'The temple will be closed next week for scheduled renovation work.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = announcementSchema.safeParse({ title: '', content: 'Some content' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty content', () => {
    const result = announcementSchema.safeParse({ title: 'Title', content: '' })
    expect(result.success).toBe(false)
  })

  it(`accepts exactly ${ANNOUNCEMENT_TITLE_MAX_LENGTH} characters for the title`, () => {
    const result = announcementSchema.safeParse({
      title: 'a'.repeat(ANNOUNCEMENT_TITLE_MAX_LENGTH),
      content: 'Some content',
    })
    expect(result.success).toBe(true)
  })

  it(`rejects ${ANNOUNCEMENT_TITLE_MAX_LENGTH + 1} characters for the title`, () => {
    const result = announcementSchema.safeParse({
      title: 'a'.repeat(ANNOUNCEMENT_TITLE_MAX_LENGTH + 1),
      content: 'Some content',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('title')
    }
  })

  it(`accepts exactly ${ANNOUNCEMENT_CONTENT_MAX_LENGTH} characters for the content`, () => {
    const result = announcementSchema.safeParse({
      title: 'Title',
      content: 'a'.repeat(ANNOUNCEMENT_CONTENT_MAX_LENGTH),
    })
    expect(result.success).toBe(true)
  })

  it(`rejects ${ANNOUNCEMENT_CONTENT_MAX_LENGTH + 1} characters for the content`, () => {
    const result = announcementSchema.safeParse({
      title: 'Title',
      content: 'a'.repeat(ANNOUNCEMENT_CONTENT_MAX_LENGTH + 1),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('content')
    }
  })
})
