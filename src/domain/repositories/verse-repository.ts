import type { VerseOfTheDay } from '@/domain/entities/verse-of-the-day'

export interface VerseRepository {
  // Published citations, each joined with its local content when
  // available, ordered by orderIndex ascending — the order the
  // deterministic rotation in application/verse/select-verse-for-date.ts
  // depends on. A single call so the citation and its content share one
  // cache entry.
  listPublishedVerses(): Promise<VerseOfTheDay[]>
}
