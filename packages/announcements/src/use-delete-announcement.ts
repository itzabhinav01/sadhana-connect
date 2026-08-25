import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementQueryKeys } from './announcement-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAnnouncementRepository } from '@sadhana-connect/infra-supabase'

// Own-row only — enforced by RLS (announcements_delete), not this hook.
export function useDeleteAnnouncement() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (id: string) => supabaseAnnouncementRepository.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.list(userId),
      })
    },
  })
}
