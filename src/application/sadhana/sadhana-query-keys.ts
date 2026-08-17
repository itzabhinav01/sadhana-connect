// Scoped by both userId and date — switching users OR switching the
// selected date must never serve another day's (or another user's)
// cached report. Same leakage-prevention pattern as profileQueryKeys.
export const sadhanaQueryKeys = {
  all: ['sadhana-report'] as const,
  detail: (userId: string | null, reportDate: string) =>
    ['sadhana-report', userId, reportDate] as const,
}
