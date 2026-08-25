import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAnnouncementRepository } from '@sadhana-connect/infra-supabase/announcement-repository'

interface UpdateAnnouncementInput {
  id: string
  title: string
  content: string
  isPublished: boolean
  expiresAt: string | null
  isPinned: boolean
}

// Own-row only, re-validated against the same scope/temple-group rule on
// every edit — enforced by RLS (announcements_update), not this hook.
// Also used for the Publish/Unpublish and Pin/Unpin toggle buttons —
// callers pass every field through unchanged except the one being
// toggled (same pattern AdminAnnouncementList already used for publish
// before this phase).
export function useUpdateAnnouncement() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ id, title, content, isPublished, expiresAt, isPinned }: UpdateAnnouncementInput) =>
      supabaseAnnouncementRepository.updateAnnouncement(id, {
        title,
        content,
        isPublished,
        expiresAt,
        isPinned,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.list(userId),
      })
    },
  })
}
