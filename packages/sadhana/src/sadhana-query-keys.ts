// Scoped by both userId and date — switching users OR switching the
// selected date must never serve another day's (or another user's)
// cached report. Same leakage-prevention pattern as profileQueryKeys.
//
// range/recent stay under the same 'sadhana-report' prefix as detail, so
// the existing logout cleanup (removeQueries({ queryKey: all })) clears
// them too via TanStack Query's default prefix matching — no separate
// cleanup needed.
export const sadhanaQueryKeys = {
  all: ['sadhana-report'] as const,
  detail: (userId: string | null, reportDate: string) =>
    ['sadhana-report', userId, reportDate] as const,
  // rangeAll/recentAll are prefix keys for targeted invalidation after a
  // save (see useUpsertSadhanaReport) — narrower than `all`, so a save
  // never triggers a redundant refetch of the detail query that was just
  // seeded directly via setQueryData.
  rangeAll: ['sadhana-report', 'range'] as const,
  range: (userId: string | null, startDate: string, endDate: string) =>
    ['sadhana-report', 'range', userId, startDate, endDate] as const,
  recentAll: ['sadhana-report', 'recent'] as const,
  recent: (userId: string | null, limit: number) =>
    ['sadhana-report', 'recent', userId, limit] as const,
  // No cursor in the key — useInfiniteQuery tracks pages internally
  // under one key per (userId, fromDate, toDate) combination. Changing a
  // filter is therefore automatically a fresh query starting at page 1.
  historyAll: ['sadhana-report', 'history'] as const,
  history: (
    userId: string | null,
    fromDate: string | undefined,
    toDate: string | undefined,
  ) => ['sadhana-report', 'history', userId, fromDate ?? null, toDate ?? null] as const,
  // Devotee oversight (Phase 20B) — a mentor or admin VIEWER looking at a
  // TARGET devotee's report history over a range. Scoped by both the
  // viewer's own userId and the target devoteeId (mirrors
  // mentorQueryKeys.devoteeRecent's own reasoning) plus the exact range,
  // so switching viewer account, target devotee, or range never serves
  // stale data.
  devoteeHistoryAll: ['sadhana-report', 'devotee-history'] as const,
  devoteeHistory: (
    viewerUserId: string | null,
    devoteeId: string,
    startDate: string,
    endDate: string,
  ) => ['sadhana-report', 'devotee-history', viewerUserId, devoteeId, startDate, endDate] as const,
  // Full reports queries (all columns) for range exports and in-app previews
  fullRangeAll: ['sadhana-report', 'full-range'] as const,
  fullRange: (userId: string | null, startDate: string, endDate: string) =>
    ['sadhana-report', 'full-range', userId, startDate, endDate] as const,
  devoteeFullHistoryAll: ['sadhana-report', 'devotee-full-history'] as const,
  devoteeFullHistory: (
    viewerUserId: string | null,
    devoteeId: string,
    startDate: string,
    endDate: string,
  ) =>
    ['sadhana-report', 'devotee-full-history', viewerUserId, devoteeId, startDate, endDate] as const,
}
