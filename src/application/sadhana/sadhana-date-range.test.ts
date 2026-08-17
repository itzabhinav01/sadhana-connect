import { describe, expect, it } from 'vitest'

import {
  MAX_CUSTOM_RANGE_DAYS,
  getLastNDaysRange,
  validateDateRange,
} from '@/application/sadhana/sadhana-date-range'
import { addDaysIso } from '@/shared/utils/date'

describe('getLastNDaysRange', () => {
  it('spans N days inclusive, ending on the given "today"', () => {
    const range = getLastNDaysRange(7, '2026-01-15')
    expect(range.toDate).toBe('2026-01-15')
    expect(range.fromDate).toBe('2026-01-09')
  })

  it('spans 30 days inclusive', () => {
    const range = getLastNDaysRange(30, '2026-01-30')
    expect(range.fromDate).toBe(addDaysIso('2026-01-30', -29))
    expect(range.toDate).toBe('2026-01-30')
  })

  it('defaults "today" to the local current date when not given', () => {
    const range = getLastNDaysRange(7)
    expect(range.toDate.length).toBe(10)
  })
})

describe('validateDateRange', () => {
  it('accepts a valid range', () => {
    expect(validateDateRange('2026-01-01', '2026-01-15')).toEqual({
      valid: true,
    })
  })

  it('accepts a single-day range', () => {
    expect(validateDateRange('2026-01-15', '2026-01-15')).toEqual({
      valid: true,
    })
  })

  it('rejects a range where fromDate is after toDate', () => {
    const result = validateDateRange('2026-01-16', '2026-01-15')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toMatch(/from date must be before to date/i)
    }
  })

  it('accepts a range exactly at the maximum length', () => {
    const toDate = '2026-12-31'
    const fromDate = addDaysIso(toDate, -(MAX_CUSTOM_RANGE_DAYS - 1))
    expect(validateDateRange(fromDate, toDate)).toEqual({ valid: true })
  })

  it('rejects a range one day longer than the maximum, without rewriting the dates', () => {
    const toDate = '2026-12-31'
    const fromDate = addDaysIso(toDate, -MAX_CUSTOM_RANGE_DAYS)
    const result = validateDateRange(fromDate, toDate)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toMatch(new RegExp(`${MAX_CUSTOM_RANGE_DAYS} days`))
    }
  })
})
