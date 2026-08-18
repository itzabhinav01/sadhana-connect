import type { VerseCitation } from '@/domain/entities/verse-of-the-day'

export interface VerseRepository {
  // Published citations ordered by orderIndex ascending — the order the
  // deterministic rotation in application/verse/select-verse-for-date.ts
  // depends on.
  listPublishedVerses(): Promise<VerseCitation[]>
}
