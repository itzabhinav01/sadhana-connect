import type { VerseOfTheDay } from '@sadhana-connect/domain/entities/verse-of-the-day'
import { daysSinceEpoch } from '@/shared/utils/date'

// Deterministic date -> verse selection, identical for every user (no
// per-user input exists anywhere in this function). Assumes `verses` is
// already ordered by orderIndex ascending, as
// VerseRepository.listPublishedVerses guarantees, and that the dataset is
// append-only, so rotation never shifts for past dates as new verses are
// published later.
export function selectVerseForDate(
  dateIso: string,
  verses: VerseOfTheDay[],
): VerseOfTheDay | null {
  if (verses.length === 0) return null

  const scheduled = verses.find((verse) => verse.scheduledDate === dateIso)
  if (scheduled) return scheduled

  const index = daysSinceEpoch(dateIso) % verses.length
  return verses[index]
}
