// One currently-active assignment, as seen by the mentor side. Not the
// devotee's full profile — only what the Mentor Dashboard needs (see
// CLAUDE.md: "do not expose unnecessary profile information").
export interface MentorAssignedDevotee {
  devoteeId: string
  fullName: string
  assignedAt: string // ISO timestamp
}
