import { describe, expect, it } from 'vitest'

import { selectVerseForDate } from './select-verse-for-date'
import type { VerseOfTheDay } from '@sadhana-connect/domain'

function makeVerse(overrides: Partial<VerseOfTheDay>): VerseOfTheDay {
  return {
    id: 'id',
    chapter: 2,
    verseNumber: '47',
    sourceUrl: 'https://vedabase.io/en/library/bg/2/47/',
    orderIndex: 0,
    scheduledDate: null,
    content: null,
    ...overrides,
  }
}

describe('selectVerseForDate', () => {
  it('returns null when there are no published verses', () => {
    expect(selectVerseForDate('2026-01-15', [])).toBeNull()
  })

  it('selects by daysSinceEpoch modulo the dataset length', () => {
    const verses = [
      makeVerse({ id: 'v0', orderIndex: 0 }),
      makeVerse({ id: 'v1', orderIndex: 1 }),
      makeVerse({ id: 'v2', orderIndex: 2 }),
    ]

    // daysSinceEpoch('1970-01-01') === 0 -> index 0
    expect(selectVerseForDate('1970-01-01', verses)?.id).toBe('v0')
    // daysSinceEpoch('1970-01-02') === 1 -> index 1
    expect(selectVerseForDate('1970-01-02', verses)?.id).toBe('v1')
  })

  it('wraps around at the end of the dataset', () => {
    const verses = [
      makeVerse({ id: 'v0', orderIndex: 0 }),
      makeVerse({ id: 'v1', orderIndex: 1 }),
      makeVerse({ id: 'v2', orderIndex: 2 }),
    ]

    // daysSinceEpoch('1970-01-04') === 3 -> 3 % 3 === 0 -> wraps to v0
    expect(selectVerseForDate('1970-01-04', verses)?.id).toBe('v0')
  })

  it('is deterministic — the same date and dataset always select the same verse', () => {
    const verses = [
      makeVerse({ id: 'v0', orderIndex: 0 }),
      makeVerse({ id: 'v1', orderIndex: 1 }),
    ]

    const first = selectVerseForDate('2026-05-10', verses)
    const second = selectVerseForDate('2026-05-10', verses)

    expect(first).toEqual(second)
  })

  it('has no per-user input, so it always returns the same citation regardless of which user calls it', () => {
    const verses = [makeVerse({ id: 'v0', orderIndex: 0 })]

    // The function signature itself has no user/session parameter — calling
    // it repeatedly (simulating different users) with the same date and
    // dataset can only ever produce the same result.
    const results = [1, 2, 3].map(() => selectVerseForDate('2026-05-10', verses))

    expect(new Set(results.map((v) => v?.id))).toEqual(new Set(['v0']))
  })

  it('an explicit scheduledDate override wins over the rotation result', () => {
    const verses = [
      makeVerse({ id: 'v0', orderIndex: 0 }),
      makeVerse({ id: 'v1', orderIndex: 1, scheduledDate: '1970-01-01' }),
    ]

    // Rotation alone would pick v0 for '1970-01-01' (daysSinceEpoch === 0),
    // but v1's explicit override must win.
    expect(selectVerseForDate('1970-01-01', verses)?.id).toBe('v1')
  })

  it('falls back to rotation on dates with no scheduled override', () => {
    const verses = [
      makeVerse({ id: 'v0', orderIndex: 0 }),
      makeVerse({ id: 'v1', orderIndex: 1, scheduledDate: '1970-01-01' }),
    ]

    // daysSinceEpoch('1970-01-03') === 2 -> 2 % 2 === 0 -> v0, and
    // '1970-01-03' has no scheduled override so rotation applies normally.
    expect(selectVerseForDate('1970-01-03', verses)?.id).toBe('v0')
  })
})
