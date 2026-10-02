import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementQueryKeys } from './announcement-query-keys'
import { useAuth, useProfile } from '@sadhana-connect/auth'
import { getEffectiveTempleGroupIds } from '@sadhana-connect/domain'
import { supabaseAnnouncementRepository } from '@sadhana-connect/infra-supabase'

interface CreateMentorAnnouncementInput {
  title: string
  content: string
  isPublished: boolean
  expiresAt: string | null
  templeGroupId?: string | null
}

// Mentors may only author scope: 'temple_group' announcements, matching
// one of their own assigned temple groups — this hook enforces that rule
// client-side and defaults to their first group when they only have one.
// RLS (announcements_insert / private.can_publish_announcement) is what
// actually enforces it server-side regardless.
export function useCreateMentorAnnouncement() {
  const { session } = useAuth()
  const profile = useProfile()
  const queryClient = useQueryClient()
  const userId = session?.userId ?? null

  return useMutation({
    mutationFn: (input: CreateMentorAnnouncementInput) => {
      if (!userId) {
        throw new Error('useCreateMentorAnnouncement: no authenticated user')
      }
      const assignedGroupIds = getEffectiveTempleGroupIds(profile.data)
      if (assignedGroupIds.length === 0) {
        throw new Error(
          'useCreateMentorAnnouncement: mentor has no temple group assigned',
        )
      }
      const targetTempleGroupId = input.templeGroupId ?? assignedGroupIds[0]
      if (!targetTempleGroupId || !assignedGroupIds.includes(targetTempleGroupId)) {
        throw new Error(
          'useCreateMentorAnnouncement: mentor is not assigned to the selected temple group',
        )
      }
      return supabaseAnnouncementRepository.createAnnouncement({
        authorId: userId,
        title: input.title,
        content: input.content,
        scope: 'temple_group',
        templeGroupId: targetTempleGroupId,
        isPublished: input.isPublished,
        expiresAt: input.expiresAt,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.list(userId),
      })
    },
  })
}

