// Scoped by the VIEWER's own userId (mentor or devotee, whoever is
// looking) and the specific report — a mentor switching accounts, or a
// devotee's own session, never shares a cache entry with anyone else.
// Matches the profileQueryKeys/sadhanaQueryKeys/mentorQueryKeys
// convention throughout this codebase.
export const commentQueryKeys = {
  all: ['sadhana-report-comments'] as const,
  list: (viewerUserId: string | null, sadhanaReportId: string) =>
    ['sadhana-report-comments', viewerUserId, sadhanaReportId] as const,
}
