import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import type { SadhanaNotification } from '@/domain/entities/notification'
import { supabaseSadhanaReportRepository } from '@/infrastructure/supabase/sadhana-report-repository'

// Resolves a notification's deep link and navigates there. The report
// date lookup is cached under the query client (a repeat click on the
// same notification never re-fetches) and is only ever performed for the
// single notification actually clicked — never eagerly for the whole
// list (that would be an N+1 over every rendered row).
export function useNotificationNavigation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return async function navigateToNotification(
    notification: SadhanaNotification,
  ): Promise<void> {
    if (notification.type === 'mentor_comment' && notification.relatedReportId) {
      const reportId = notification.relatedReportId
      const reportDate = await queryClient.fetchQuery({
        queryKey: ['sadhana-report', 'date-by-id', reportId],
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

    // Fallback for a notification whose target no longer resolves (e.g.
    // the linked report/announcement was deleted) — stay on the
    // notification center rather than navigating nowhere or erroring.
    navigate('/notifications')
  }
}
