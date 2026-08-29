import { describe, expect, it } from 'vitest'

import {
  addDaysIso,
  buildDateRangeList,
  daysSinceEpoch,
  formatDateLong,
  formatIsoDateAsDdMmYyyy,
  formatIsoDateLong,
  getLocalDateIso,
} from './date'

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

describe('buildDateRangeList', () => {
  it('returns a single-element list when from and to are the same date', () => {
    expect(buildDateRangeList('2026-01-15', '2026-01-15')).toEqual([
      '2026-01-15',
    ])
  })

  it('returns every date inclusive of both endpoints', () => {
    expect(buildDateRangeList('2026-01-13', '2026-01-16')).toEqual([
      '2026-01-13',
      '2026-01-14',
      '2026-01-15',
      '2026-01-16',
    ])
  })

  it('spans a month boundary correctly', () => {
    const days = buildDateRangeList('2026-01-30', '2026-02-02')
    expect(days).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
    ])
  })

  it('returns an empty list when fromDate is after toDate', () => {
    expect(buildDateRangeList('2026-01-16', '2026-01-15')).toEqual([])
  })
})

describe('formatIsoDateAsDdMmYyyy', () => {
  it('converts YYYY-MM-DD to DD-MM-YYYY', () => {
    expect(formatIsoDateAsDdMmYyyy('2026-08-19')).toBe('19-08-2026')
  })

  it('preserves leading zeros in day and month', () => {
    expect(formatIsoDateAsDdMmYyyy('2026-01-05')).toBe('05-01-2026')
  })
})

describe('formatIsoDateLong', () => {
  it('formats a date as D Month YYYY', () => {
    expect(formatIsoDateLong('2026-08-28')).toBe('28 August 2026')
  })

  it('does not pad the day with a leading zero', () => {
    expect(formatIsoDateLong('2026-01-05')).toBe('5 January 2026')
  })
})

describe('formatDateLong', () => {
  it('formats a Date as D Month YYYY using local components', () => {
    const date = new Date(2026, 7, 28) // Aug 28, 2026, local time
    expect(formatDateLong(date)).toBe('28 August 2026')
  })
})

describe('daysSinceEpoch', () => {
  it('returns 0 for the epoch date', () => {
    expect(daysSinceEpoch('1970-01-01')).toBe(0)
  })

  it('increases by exactly 1 for each following day', () => {
    expect(daysSinceEpoch('1970-01-02')).toBe(1)
    expect(daysSinceEpoch('1970-01-03')).toBe(2)
  })

  it('spans a leap-year February correctly', () => {
    expect(daysSinceEpoch('2028-03-01') - daysSinceEpoch('2028-02-01')).toBe(29)
    expect(daysSinceEpoch('2026-03-01') - daysSinceEpoch('2026-02-01')).toBe(28)
  })

  it('is stable for the same input regardless of when it is called', () => {
    expect(daysSinceEpoch('2026-06-15')).toBe(daysSinceEpoch('2026-06-15'))
  })
})
