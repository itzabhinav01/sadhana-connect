// Every key is scoped by the VIEWING MENTOR's own userId, matching the
// profileQueryKeys/sadhanaQueryKeys convention throughout this codebase —
// switching mentor accounts changes every key's prefix, so nothing leaks
// across accounts. Detail-page keys are scoped by both the mentor's userId
// and the devoteeId, so switching between two devotees never serves stale
// data either.
export const mentorQueryKeys = {
  all: ['mentor'] as const,
  devotees: (mentorUserId: string | null) =>
    ['mentor', 'devotees', mentorUserId] as const,
  devoteeProfile: (mentorUserId: string | null, devoteeId: string) =>
    ['mentor', 'devotee-profile', mentorUserId, devoteeId] as const,
  devoteeToday: (
    mentorUserId: string | null,
    devoteeId: string,
    dateIso: string,
  ) => ['mentor', 'devotee-today', mentorUserId, devoteeId, dateIso] as const,
  devoteeRecent: (
    mentorUserId: string | null,
    devoteeId: string,
    limit: number,
  ) => ['mentor', 'devotee-recent', mentorUserId, devoteeId, limit] as const,
  devoteeAssignedSince: (mentorUserId: string | null, devoteeId: string) =>
    ['mentor', 'devotee-assigned-since', mentorUserId, devoteeId] as const,
}
