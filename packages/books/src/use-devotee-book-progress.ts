import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { useAuth } from '@sadhana-connect/auth'
import { calculateBookProgress } from './calculate-book-progress'
import { booksKeys } from './books-query-keys'
import { usePrabhupadaBooks } from './use-prabhupada-books'
import { PRABHUPADA_BOOKS_LIST } from './books-data'
import {
  getLocalBookProgressAsync,
  getLocalBookProgressSync,
  saveLocalBookProgress,
} from './book-progress-storage'
import type {
  BookProgressSummary,
  BookReadingStatus,
  BookWithProgress,
  DevoteeBookProgress,
  PrabhupadaBook,
} from './books-types'

function buildProgressWithLocal(
  catalog: readonly PrabhupadaBook[],
  profileId: string | null,
) {
  const localMap = profileId ? getLocalBookProgressSync(profileId) : new Map()
  const booksWithProgress: BookWithProgress[] = catalog.map((book) => {
    const local = localMap.get(book.id)
    return {
      ...book,
      status: local?.status ?? ('not_started' as BookReadingStatus),
      completedAt: local?.completedAt ?? null,
    }
  })
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
    initialData: () => buildProgressWithLocal(activeCatalog, effectiveProfileId),
    queryFn: async (): Promise<{
      progressList: DevoteeBookProgress[]
      booksWithProgress: BookWithProgress[]
      summary: BookProgressSummary
    }> => {
      if (!effectiveProfileId) {
        return buildProgressWithLocal(activeCatalog, null)
      }

      // 1. Load local progress first so user selections are never lost
      const localProgressMap = await getLocalBookProgressAsync(effectiveProfileId)

      // 2. Query Supabase
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('devotee_book_progress')
        .select('id, profile_id, book_id, status, completed_at, updated_at')
        .eq('profile_id', effectiveProfileId)

      const progressMap = new Map<
        number,
        { status: BookReadingStatus; completedAt?: string | null; id?: string }
      >()

      // Populate from local progress
      for (const [bookId, item] of localProgressMap.entries()) {
        progressMap.set(bookId, {
          status: item.status,
          completedAt: item.completedAt,
        })
      }

      // If remote Supabase returned records, merge and persist to local storage
      if (!error && data && data.length > 0) {
        for (const row of data) {
          progressMap.set(row.book_id, {
            status: row.status as BookReadingStatus,
            completedAt: row.completed_at,
            id: row.id,
          })
          saveLocalBookProgress(
            effectiveProfileId,
            row.book_id,
            row.status as BookReadingStatus,
            row.completed_at,
          )
        }
      } else if (error) {
        console.warn(
          'Could not fetch remote devotee_book_progress (using persistent local storage):',
          error.message,
        )
      }

      const progressList: DevoteeBookProgress[] = []
      const booksWithProgress: BookWithProgress[] = activeCatalog.map((book) => {
        const progress = progressMap.get(book.id)
        if (progress) {
          progressList.push({
            id: progress.id ?? `local-${book.id}`,
            profileId: effectiveProfileId,
            bookId: book.id,
            status: progress.status,
            completedAt: progress.completedAt ?? null,
            updatedAt: new Date().toISOString(),
          })
        }
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
