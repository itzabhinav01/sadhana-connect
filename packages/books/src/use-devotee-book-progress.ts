import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { useAuth } from '@sadhana-connect/auth'
import { calculateBookProgress } from './calculate-book-progress'
import { booksKeys } from './books-query-keys'
import { usePrabhupadaBooks } from './use-prabhupada-books'
import { PRABHUPADA_BOOKS_LIST } from './books-data'
import type {
  BookProgressSummary,
  BookReadingStatus,
  BookWithProgress,
  DevoteeBookProgress,
  PrabhupadaBook,
} from './books-types'

function buildDefaultProgress(catalog: readonly PrabhupadaBook[]) {
  const booksWithProgress: BookWithProgress[] = catalog.map((book) => ({
    ...book,
    status: 'not_started' as BookReadingStatus,
    completedAt: null,
  }))
  const summary = calculateBookProgress(booksWithProgress, catalog.length)
  return {
    progressList: [] as DevoteeBookProgress[],
    booksWithProgress,
    summary,
  }
}

export function useDevoteeBookProgress(profileId?: string | null) {
  const { session } = useAuth()
  const effectiveProfileId = profileId ?? session?.userId ?? null
  const { data: catalog = PRABHUPADA_BOOKS_LIST } = usePrabhupadaBooks()
  const activeCatalog = catalog && catalog.length > 0 ? catalog : PRABHUPADA_BOOKS_LIST

  return useQuery({
    queryKey: booksKeys.devoteeProgress(effectiveProfileId),
    enabled: Boolean(effectiveProfileId),
    initialData: () => buildDefaultProgress(activeCatalog),
    queryFn: async (): Promise<{
      progressList: DevoteeBookProgress[]
      booksWithProgress: BookWithProgress[]
      summary: BookProgressSummary
    }> => {
      if (!effectiveProfileId) {
        return buildDefaultProgress(activeCatalog)
      }

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('devotee_book_progress')
        .select('id, profile_id, book_id, status, completed_at, updated_at')
        .eq('profile_id', effectiveProfileId)

      if (error) {
        console.warn(
          'Could not fetch devotee_book_progress (table may need migration):',
          error.message,
        )
        return buildDefaultProgress(activeCatalog)
      }

      const progressMap = new Map<
        number,
        { status: BookReadingStatus; completedAt?: string | null; id?: string }
      >()
      const progressList: DevoteeBookProgress[] = (data || []).map((row) => {
        const item: DevoteeBookProgress = {
          id: row.id,
          profileId: row.profile_id,
          bookId: row.book_id,
          status: row.status as BookReadingStatus,
          completedAt: row.completed_at,
          updatedAt: row.updated_at,
        }
        progressMap.set(row.book_id, {
          status: item.status,
          completedAt: item.completedAt,
          id: item.id,
        })
        return item
      })

      const booksWithProgress: BookWithProgress[] = activeCatalog.map((book) => {
        const progress = progressMap.get(book.id)
        return {
          ...book,
          status: progress?.status ?? 'not_started',
          completedAt: progress?.completedAt ?? null,
        }
      })

      const summary = calculateBookProgress(booksWithProgress, activeCatalog.length)

      return {
        progressList,
        booksWithProgress,
        summary,
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}
