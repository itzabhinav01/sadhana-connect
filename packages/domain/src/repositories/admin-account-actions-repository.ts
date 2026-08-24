export type HardDeleteStage = 'profile-deleted' | 'complete'

export interface HardDeleteResult {
  stage: HardDeleteStage
}

// Client-side boundary for the trusted admin-account-actions Edge
// Function — the ONLY place service-role-backed Auth Admin operations are
// reachable from. Every method here is a thin network call; all real
// authorization (caller must be an active super admin, target validation,
// peer-super_admin/self-target rejection) happens inside the function
// itself, never in this repository or its callers.
export interface AdminAccountActionsRepository {
  banUser(targetUserId: string): Promise<void>
  unbanUser(targetUserId: string): Promise<void>

  // Returns a one-time recovery link. Callers must never cache, log, or
  // persist this value — display-once-and-discard only.
  generateRecoveryLink(targetUserId: string): Promise<string>

  // Admin-detail-view-only, on-demand — never stored in profiles (would
  // expose it to mentors under existing row-level profiles RLS), never
  // fetched as part of any list.
  getUserEmail(targetUserId: string): Promise<string>

  // Phase 20C: true hard delete — permanently removes the profile (and
  // everything that cascades from it per 0013) and the underlying
  // Supabase Auth account. Irreversible. 'profile-deleted' means the
  // data is gone but the Auth account's removal could not be confirmed
  // (rare; see the Edge Function's own doc comment) — there is no retry
  // for this stage, since the profile this caller was looking at is
  // already gone.
  hardDeleteUser(targetUserId: string): Promise<HardDeleteResult>
}
