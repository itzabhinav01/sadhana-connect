import type { MentorAssignedDevotee } from '@/domain/entities/mentor-devotee'
import type { MentorDevoteeReportSummary } from '@/domain/entities/sadhana-report'

export interface DevoteeLastReportDate {
  devoteeId: string
  lastReportDate: string
}

export interface MentorRepository {
  // Currently active devotees assigned to this mentor. RLS
  // (mentor_assignments_select + profiles_select via private.is_mentor_of)
  // is the real authorization boundary — mentorId is passed explicitly as
  // a defense-in-depth WHERE clause, matching every other repository in
  // this codebase, never relied on as the actual security mechanism.
  listAssignedDevotees(mentorId: string): Promise<MentorAssignedDevotee[]>

  // One batched query across every given devotee id, never one request
  // per devotee. Used for the 7-day recent-activity window (today's
  // status/rounds + recent activity) — not full history. Narrowed
  // (Phase 20) to exactly the fields calculateMentorDevoteeSummaries
  // reads — traced, not guessed.
  listReportsForDevotees(
    devoteeIds: string[],
    fromDate: string,
  ): Promise<MentorDevoteeReportSummary[]>

  // All-time last report date per devotee, via the security_invoker
  // mentor_devotee_last_reports view (0003_mentor_devotee_last_reports).
  // Already scoped to this mentor's authorized devotees by the view's own
  // RLS-inherited behavior — no id list needs to be passed in.
  listLastReportDates(): Promise<DevoteeLastReportDate[]>

  // The active assignment's assigned_at for one specific devotee, fetched
  // fresh (not reused from a list the mentor may not have come from) so
  // the devotee detail page works correctly on a direct URL visit. Returns
  // null when there is no active assignment between this mentor and this
  // devotee — mentor_assignments' own RLS only requires mentor_id =
  // auth.uid(), so this can be non-null even if the devotee's profile has
  // since become inaccessible elsewhere; callers must not treat a non-null
  // result here as proof of current profile/report access.
  getAssignedSince(mentorId: string, devoteeId: string): Promise<string | null>
}
