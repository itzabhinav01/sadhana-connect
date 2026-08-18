import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { supabaseAnnouncementRepository } from '@/infrastructure/supabase/announcement-repository'

interface UpdateAnnouncementInput {
  id: string
  title: string
  content: string
  isPublished: boolean
}

// Own-row only, re-validated against the same scope/temple-group rule on
// every edit — enforced by RLS (announcements_update), not this hook.
export function useUpdateAnnouncement() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ id, title, content, isPublished }: UpdateAnnouncementInput) =>
      supabaseAnnouncementRepository.updateAnnouncement(id, {
        title,
        content,
        isPublished,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.list(userId),
      })
    },
  })
}
