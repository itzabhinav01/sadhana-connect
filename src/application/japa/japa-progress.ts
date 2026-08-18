import { BEADS_PER_ROUND } from '@/shared/constants/japa'

export interface JapaProgress {
  totalTapsToday: number
  completedRounds: number
  // 1-indexed — the round currently in progress (or about to start).
  currentRound: number
  // 0..107 — position within the current round. 0 means a fresh round
  // hasn't been started yet (either totalTapsToday is 0, or the last tap
  // just completed a round).
  currentBead: number
  targetRounds: number
  // Can exceed 1 once the target is surpassed — the counter never stops.
  targetProgress: number
  targetReached: boolean
}

// A single stored integer (totalTapsToday) is the only source of truth
// — every other value here is derived from it and targetRounds, never
// independently stored or mutated (approved decision, Phase 10).
export function calculateJapaProgress(
  totalTapsToday: number,
  targetRounds: number,
): JapaProgress {
  const completedRounds = Math.floor(totalTapsToday / BEADS_PER_ROUND)
  const currentBead = totalTapsToday % BEADS_PER_ROUND

  return {
    totalTapsToday,
    completedRounds,
    currentRound: completedRounds + 1,
    currentBead,
    targetRounds,
    targetProgress: targetRounds > 0 ? completedRounds / targetRounds : 0,
    targetReached: completedRounds >= targetRounds,
  }
}
