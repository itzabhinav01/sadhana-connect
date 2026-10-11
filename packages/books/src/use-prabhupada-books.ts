import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { PRABHUPADA_BOOKS_LIST } from './books-data'
import { booksKeys } from './books-query-keys'
import type { PrabhupadaBook } from './books-types'

export function usePrabhupadaBooks() {
  return useQuery({
    queryKey: booksKeys.catalog(),
    queryFn: async (): Promise<PrabhupadaBook[]> => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('prabhupada_books')
        .select('id, sequence_number, title, reading_url')
        .order('sequence_number', { ascending: true })

      if (error || !data || data.length === 0) {
        // Fall back to pre-seeded static catalog if table isn't migrated yet or offline
        return [...PRABHUPADA_BOOKS_LIST]
      }

      return data.map((item) => ({
        id: item.id,
        sequenceNumber: item.sequence_number,
        title: item.title,
        readingUrl: item.reading_url,
      }))
    },
    initialData: [...PRABHUPADA_BOOKS_LIST],
    staleTime: 1000 * 60 * 60, // Books catalog is static; cache for 1 hour
  })
}
