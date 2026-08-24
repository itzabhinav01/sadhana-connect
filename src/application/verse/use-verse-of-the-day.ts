import { useQuery } from '@tanstack/react-query'

import { selectVerseForDate } from '@/application/verse/select-verse-for-date'
import { verseQueryKeys } from '@/application/verse/verse-query-keys'
import { supabaseVerseRepository } from '@sadhana-connect/infra-supabase/verse-repository'
import { getLocalDateIso } from '@/shared/utils/date'

const STALE_TIME_MS = 24 * 60 * 60 * 1000

// Deliberately not scoped by userId — see verse-query-keys.ts. Returns
// `null` (not an error) when no published verse resolves for today, so the
// page can render an honest "not available yet" empty state rather than a
// fabricated fallback.
export function useVerseOfTheDay() {
  const dateIso = getLocalDateIso()

  return useQuery({
    queryKey: verseQueryKeys.detail(dateIso),
    queryFn: async () => {
      const verses = await supabaseVerseRepository.listPublishedVerses()
      return selectVerseForDate(dateIso, verses)
    },
    staleTime: STALE_TIME_MS,
  })
}
