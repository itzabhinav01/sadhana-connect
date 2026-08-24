// Admin-facing view of a mentor_assignments row — distinct from
// MentorAssignedDevotee (the mentor's own narrower view), since the admin
// list needs both sides' names and the full active/history lifecycle.
export interface AdminMentorAssignment {
  id: string
  mentorId: string
  mentorName: string
  devoteeId: string
  devoteeName: string
  isActive: boolean
  assignedAt: string
  unassignedAt: string | null
}
