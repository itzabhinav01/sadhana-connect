import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@sadhana-connect/auth'
import type { SadhanaNotification } from '@sadhana-connect/domain/entities/notification'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase/sadhana-report-repository'

// Resolves a notification's deep link and navigates there. The report
// date lookup is cached under the query client (a repeat click on the
// same notification never re-fetches) and is only ever performed for the
// single notification actually clicked — never eagerly for the whole
// list (that would be an N+1 over every rendered row).
export function useNotificationNavigation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session?.userId ?? null

  return async function navigateToNotification(
    notification: SadhanaNotification,
  ): Promise<void> {
    if (notification.type === 'mentor_comment' && notification.relatedReportId) {
      const reportId = notification.relatedReportId
      const reportDate = await queryClient.fetchQuery({
        // Scoped by userId, consistent with every other query key in the
        // app — the fetch itself is already RLS-authorized regardless,
        // but an unscoped key would let this one cache entry be the sole
        // exception across account switches on a shared device.
        queryKey: ['sadhana-report', 'date-by-id', userId, reportId],
        queryFn: () => supabaseSadhanaReportRepository.getReportDateById(reportId),
      })
      if (reportDate) {
        navigate(`/sadhana?date=${reportDate}`)
        return
      }
    }

    if (notification.type === 'announcement' && notification.relatedAnnouncementId) {
      navigate(`/announcements/${notification.relatedAnnouncementId}`)
      return
    }

    // sadhana_reminder (Phase 20B) has no single related row to deep-link
    // to — it's about a range of missed days, not one date — so it opens
    // the devotee's own Sadhana form directly, same as any other
    // unresolvable-target fallback below, just explicit about why.
    if (notification.type === 'sadhana_reminder') {
      navigate('/sadhana')
      return
    }

    // Fallback for a notification whose target no longer resolves (e.g.
    // the linked report/announcement was deleted) — stay on the
    // notification center rather than navigating nowhere or erroring.
    navigate('/notifications')
  }
}
