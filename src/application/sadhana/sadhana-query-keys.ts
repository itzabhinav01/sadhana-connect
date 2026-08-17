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
}
