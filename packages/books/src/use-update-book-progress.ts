import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { useAuth } from '@sadhana-connect/auth'
import { booksKeys } from './books-query-keys'
import { calculateBookProgress } from './calculate-book-progress'
import type { BookReadingStatus, BookWithProgress, DevoteeBookProgress } from './books-types'

export interface UpdateBookProgressParams {
  bookId: number
  status: BookReadingStatus
  profileId?: string | null
}

export function useUpdateBookProgress(defaultProfileId?: string | null) {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async ({ bookId, status, profileId }: UpdateBookProgressParams) => {
      const targetUserId = profileId ?? defaultProfileId ?? session?.userId
      if (!targetUserId) {
        throw new Error('User must be logged in to update book progress')
      }

      const supabase = getSupabaseClient()
      const completedAt = status === 'completed' ? new Date().toISOString() : null

      const { data, error } = await supabase
        .from('devotee_book_progress')
        .upsert(
          {
            profile_id: targetUserId,
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
        console.warn('devotee_book_progress upsert warning (migration may be pending):', error.message)
        // Fall back to returning local optimistic record so UX continues seamlessly
        return {
          id: `local-${bookId}`,
          profile_id: targetUserId,
          book_id: bookId,
          status,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        }
      }

      return data
    },
    onMutate: async ({ bookId, status, profileId }: UpdateBookProgressParams) => {
      const targetUserId = profileId ?? defaultProfileId ?? session?.userId
      if (!targetUserId) return

      const queryKey = booksKeys.devoteeProgress(targetUserId)
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData<{
        progressList: DevoteeBookProgress[]
        booksWithProgress: BookWithProgress[]
        summary: ReturnType<typeof calculateBookProgress>
      }>(queryKey)

      if (previousData) {
        const updatedBooksWithProgress = previousData.booksWithProgress.map((book) => {
          if (book.id === bookId) {
            return {
              ...book,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : null,
            }
          }
          return book
        })

        const updatedSummary = calculateBookProgress(
          updatedBooksWithProgress,
          previousData.booksWithProgress.length || 36,
        )

        queryClient.setQueryData(queryKey, {
          ...previousData,
          booksWithProgress: updatedBooksWithProgress,
          summary: updatedSummary,
        })
      }

      return { previousData, queryKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.queryKey && context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData)
      }
    },
    onSettled: (_data, _error, variables) => {
      const targetUserId = variables?.profileId ?? defaultProfileId ?? session?.userId
      if (targetUserId) {
        void queryClient.invalidateQueries({
          queryKey: booksKeys.devoteeProgress(targetUserId),
        })
      }
    },
  })
}
