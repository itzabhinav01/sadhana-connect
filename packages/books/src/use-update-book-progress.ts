import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { useAuth } from '@sadhana-connect/auth'
import { booksKeys } from './books-query-keys'
import type { BookReadingStatus } from './books-types'

export interface UpdateBookProgressParams {
  bookId: number
  status: BookReadingStatus
}

export function useUpdateBookProgress() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session?.userId

  return useMutation({
    mutationFn: async ({ bookId, status }: UpdateBookProgressParams) => {
      if (!userId) {
        throw new Error('User must be logged in to update book progress')
      }

      const supabase = getSupabaseClient()
      const completedAt = status === 'completed' ? new Date().toISOString() : null

      const { data, error } = await supabase
        .from('devotee_book_progress')
        .upsert(
          {
            profile_id: userId,
            book_id: bookId,
            status,
            completed_at: completedAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id,book_id' },
        )
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: booksKeys.devoteeProgress(userId),
        })
      }
    },
  })
}
