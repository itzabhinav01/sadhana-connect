import { describe, expect, it } from 'vitest'

import { calculateStreak } from './sadhana-streak'

const TODAY = '2026-01-15'

describe('calculateStreak', () => {
  it('returns 0 for no reports at all', () => {
    expect(calculateStreak([], TODAY)).toBe(0)
  })

  it('counts consecutive days ending today when today has a report', () => {
    const dates = ['2026-01-15', '2026-01-14', '2026-01-13']
    expect(calculateStreak(dates, TODAY)).toBe(3)
  })

  it('starts from yesterday, not zero, when today has no report yet', () => {
    const dates = ['2026-01-14', '2026-01-13', '2026-01-12']
    expect(calculateStreak(dates, TODAY)).toBe(3)
  })

  it('is 0 when today and yesterday are both missing', () => {
    const dates = ['2026-01-13', '2026-01-12']
    expect(calculateStreak(dates, TODAY)).toBe(0)
  })

  it('stops at the first gap going backward', () => {
    const dates = ['2026-01-15', '2026-01-14', '2026-01-12', '2026-01-11']
    expect(calculateStreak(dates, TODAY)).toBe(2)
  })

  it('counts a single day as a streak of 1', () => {
    expect(calculateStreak(['2026-01-15'], TODAY)).toBe(1)
  })

  it('is order-independent in the input array', () => {
    const dates = ['2026-01-13', '2026-01-15', '2026-01-14']
    expect(calculateStreak(dates, TODAY)).toBe(3)
  })

  it('ignores dates that are not part of the consecutive run', () => {
    const dates = ['2026-01-15', '2026-01-14', '2026-01-01']
    expect(calculateStreak(dates, TODAY)).toBe(2)
  })
})
