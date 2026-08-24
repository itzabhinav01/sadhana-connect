export interface JapaDailyState {
  totalTapsToday: number
  updatedAt: string
}

// Local-device storage only — the counter's own tap-by-tap state is
// ephemeral and never touches Supabase (approved decision, Phase 10).
// Mirrors the repository pattern used for Supabase-backed data
// elsewhere in this codebase, for the same reasons: a stable interface
// the application layer can depend on and tests can fake.
export interface JapaCounterStorage {
  // Falls back to DEFAULT_TARGET_ROUNDS when nothing has been stored yet.
  getTarget(userId: string): number

  // Persists indefinitely — a personal vow, not a daily value.
  setTarget(userId: string, target: number): void

  // Returns null when nothing has been counted for this user on this
  // date yet — the normal "haven't started today" state, not an error.
  getDailyState(userId: string, date: string): JapaDailyState | null

  setDailyState(userId: string, date: string, state: JapaDailyState): void

  // Removes this user's stored daily entries older than cutoffDateIso
  // (the 30-day retention policy) — never touches the target.
  pruneOldDailyStates(userId: string, cutoffDateIso: string): void
}
