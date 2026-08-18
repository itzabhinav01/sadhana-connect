// Deliberately not scoped by userId, unlike every other query key in this
// codebase — every devotee sees the identical citation on the same local
// date, so the cache is intentionally shared across all users.
export const verseQueryKeys = {
  all: ['verse-of-the-day'] as const,
  detail: (dateIso: string) => ['verse-of-the-day', dateIso] as const,
}
