import type { BookProgressSummary, BookReadingStatus } from './books-types'

export function calculateBookProgress(
  items: readonly { status: BookReadingStatus }[],
  totalBooks = 36,
): BookProgressSummary {
  let completed = 0
  let reading = 0

  for (const item of items) {
    if (item.status === 'completed') {
      completed++
    } else if (item.status === 'reading') {
      reading++
    }
  }

  const notStarted = Math.max(0, totalBooks - completed - reading)
  const completionPercentage =
    totalBooks > 0 ? Math.round((completed / totalBooks) * 100) : 0

  return {
    total: totalBooks,
    completed,
    reading,
    notStarted,
    completionPercentage,
  }
}
