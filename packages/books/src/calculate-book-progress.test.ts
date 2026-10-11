import { describe, expect, it } from 'vitest'
import { calculateBookProgress } from './calculate-book-progress'

describe('calculateBookProgress', () => {
  it('calculates progress correctly with zero completed', () => {
    const summary = calculateBookProgress([], 36)
    expect(summary).toEqual({
      total: 36,
      completed: 0,
      reading: 0,
      notStarted: 36,
      completionPercentage: 0,
    })
  })

  it('calculates counts and percentage accurately', () => {
    const summary = calculateBookProgress(
      [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'reading' },
        { status: 'reading' },
      ],
      36,
    )
    expect(summary.total).toBe(36)
    expect(summary.completed).toBe(4)
    expect(summary.reading).toBe(2)
    expect(summary.notStarted).toBe(30)
    expect(summary.completionPercentage).toBe(11) // Math.round(4/36 * 100) = 11%
  })

  it('handles 100% completion', () => {
    const items = Array.from({ length: 36 }, () => ({ status: 'completed' as const }))
    const summary = calculateBookProgress(items, 36)
    expect(summary.completionPercentage).toBe(100)
    expect(summary.notStarted).toBe(0)
  })
})
