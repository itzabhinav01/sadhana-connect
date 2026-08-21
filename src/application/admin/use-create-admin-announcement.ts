import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import type { AnnouncementScope } from '@/domain/entities/announcement'
import { supabaseAnnouncementRepository } from '@/infrastructure/supabase/announcement-repository'

interface CreateAdminAnnouncementInput {
  title: string
  content: string
  scope: AnnouncementScope
  templeGroupId: string | null
  isPublished: boolean
  expiresAt: string | null
}

// Unlike useCreateMentorAnnouncement, a Super Admin genuinely chooses the
// scope — private.can_publish_announcement's is_super_admin() branch
// already allows any scope, so the UI offers the full set (all / mentors /
// devotees / temple_group + picker). RLS is what actually enforces which
// scopes are valid, not this hook.
export function useCreateAdminAnnouncement() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (input: CreateAdminAnnouncementInput) => {
      if (!userId) {
        throw new Error('useCreateAdminAnnouncement: no authenticated user')
      }
      return supabaseAnnouncementRepository.createAnnouncement({
        authorId: userId,
        title: input.title,
        content: input.content,
        scope: input.scope,
        templeGroupId: input.templeGroupId,
        isPublished: input.isPublished,
        expiresAt: input.expiresAt,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.list(userId) })
    },
  })
}
