import { describe, expect, it } from 'vitest'

import { calculateJapaProgress } from './japa-progress'

describe('calculateJapaProgress', () => {
  it('starts at round 1, bead 0 with zero taps', () => {
    const progress = calculateJapaProgress(0, 16)
    expect(progress.completedRounds).toBe(0)
    expect(progress.currentRound).toBe(1)
    expect(progress.currentBead).toBe(0)
    expect(progress.targetReached).toBe(false)
  })

  it('increments bead position within round 1', () => {
    const progress = calculateJapaProgress(42, 16)
    expect(progress.completedRounds).toBe(0)
    expect(progress.currentRound).toBe(1)
    expect(progress.currentBead).toBe(42)
  })

  it('the 108th tap completes round 1 exactly', () => {
    const progress = calculateJapaProgress(108, 16)
    expect(progress.completedRounds).toBe(1)
    expect(progress.currentBead).toBe(0)
    expect(progress.currentRound).toBe(2)
  })

  it('the 109th tap begins round 2 at bead 1', () => {
    const progress = calculateJapaProgress(109, 16)
    expect(progress.completedRounds).toBe(1)
    expect(progress.currentBead).toBe(1)
    expect(progress.currentRound).toBe(2)
  })

  it('reaches the target at exactly targetRounds * 108 taps', () => {
    const progress = calculateJapaProgress(16 * 108, 16)
    expect(progress.completedRounds).toBe(16)
    expect(progress.targetReached).toBe(true)
    expect(progress.targetProgress).toBe(1)
  })

  it('is not yet at target one tap before it', () => {
    const progress = calculateJapaProgress(16 * 108 - 1, 16)
    expect(progress.completedRounds).toBe(15)
    expect(progress.targetReached).toBe(false)
  })

  it('keeps counting beyond the target without restriction', () => {
    const progress = calculateJapaProgress(20 * 108 + 5, 16)
    expect(progress.completedRounds).toBe(20)
    expect(progress.targetReached).toBe(true)
    expect(progress.targetProgress).toBeCloseTo(20 / 16)
    expect(progress.currentBead).toBe(5)
  })

  it('computes targetProgress as a fraction of the target', () => {
    const progress = calculateJapaProgress(8 * 108, 16)
    expect(progress.targetProgress).toBe(0.5)
  })
})
