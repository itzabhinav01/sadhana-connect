import { describe, expect, it } from 'vitest'

import {
  AUTHOR_NAME,
  formatVerseCitation,
  formatVerseCitationForCopy,
} from './format-verse-citation'

describe('formatVerseCitation', () => {
  it('formats a single verse number', () => {
    expect(formatVerseCitation({ chapter: 2, verseNumber: '47' })).toBe(
      'Bhagavad-gītā As It Is 2.47',
    )
  })

  it('formats a combined verse range', () => {
    expect(formatVerseCitation({ chapter: 9, verseNumber: '20-22' })).toBe(
      'Bhagavad-gītā As It Is 9.20-22',
    )
  })
})

describe('formatVerseCitationForCopy', () => {
  it('includes the citation, author, and source URL, and nothing else', () => {
    const copied = formatVerseCitationForCopy({
      chapter: 2,
      verseNumber: '47',
      sourceUrl: 'https://vedabase.io/en/library/bg/2/47/',
    })

    expect(copied).toBe(
      `Bhagavad-gītā As It Is 2.47\n${AUTHOR_NAME}\nhttps://vedabase.io/en/library/bg/2/47/`,
    )
  })
})
