import { describe, expect, it } from 'vitest'

import { addDaysIso, getLocalDateIso } from '@/shared/utils/date'

describe('getLocalDateIso', () => {
  it('formats a date as YYYY-MM-DD using local components', () => {
    const date = new Date(2026, 0, 5) // Jan 5, 2026, local time
    expect(getLocalDateIso(date)).toBe('2026-01-05')
  })
})

describe('addDaysIso', () => {
  it('adds days within the same month', () => {
    expect(addDaysIso('2026-01-15', 3)).toBe('2026-01-18')
  })

  it('subtracts days with a negative offset', () => {
    expect(addDaysIso('2026-01-15', -6)).toBe('2026-01-09')
  })

  it('rolls over a month boundary', () => {
    expect(addDaysIso('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('rolls over a year boundary', () => {
    expect(addDaysIso('2025-12-31', 1)).toBe('2026-01-01')
  })

  it('rolls backward over a month boundary', () => {
    expect(addDaysIso('2026-02-01', -1)).toBe('2026-01-31')
  })

  it('returns the same date for a zero offset', () => {
    expect(addDaysIso('2026-01-15', 0)).toBe('2026-01-15')
  })
})
