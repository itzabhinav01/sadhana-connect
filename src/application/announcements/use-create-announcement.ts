import { useMutation, useQueryClient } from '@tanstack/react-query'

import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { useAuth } from '@/application/auth/use-auth'
import { useProfile } from '@/application/profile/use-profile'
import { supabaseAnnouncementRepository } from '@sadhana-connect/infra-supabase/announcement-repository'

interface CreateMentorAnnouncementInput {
  title: string
  content: string
  isPublished: boolean
  expiresAt: string | null
}

// Mentors may only author scope: 'temple_group' announcements, matching
// their own profile.temple_group_id — this hook hardcodes that rule so
// no caller (and no UI) can ever offer a scope choice that could only
// fail. RLS (announcements_insert / private.can_publish_announcement) is
// what actually enforces it regardless; this is not a substitute for
// that, just the reason the UI never shows the choice in the first
// place. Throws (surfaced as a mutation error) if the mentor has no
// temple group yet — callers should prefer not rendering the form at all
// in that case (see MentorAnnouncementsPage's prerequisite state).
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
      if (!profile.data?.templeGroupId) {
        throw new Error(
          'useCreateMentorAnnouncement: mentor has no temple group assigned',
        )
      }
      return supabaseAnnouncementRepository.createAnnouncement({
        authorId: userId,
        title: input.title,
        content: input.content,
        scope: 'temple_group',
        templeGroupId: profile.data.templeGroupId,
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
