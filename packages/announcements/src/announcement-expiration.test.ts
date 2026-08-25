import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  resolveExpirationError,
  resolveExpiresAt,
  toExpirationFormValue,
} from './announcement-expiration'

describe('resolveExpiresAt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("'never' resolves to null — a permanent announcement", () => {
    expect(resolveExpiresAt('never', null)).toBeNull()
  })

  it.each([
    ['1d', '2026-01-16T12:00:00.000Z'],
    ['3d', '2026-01-18T12:00:00.000Z'],
    ['7d', '2026-01-22T12:00:00.000Z'],
    ['14d', '2026-01-29T12:00:00.000Z'],
    ['30d', '2026-02-14T12:00:00.000Z'],
  ] as const)('%s resolves to exactly now + that many days', (preset, expected) => {
    expect(resolveExpiresAt(preset, null)).toBe(expected)
  })

  it("'custom' passes the given ISO date straight through", () => {
    expect(resolveExpiresAt('custom', '2026-03-01T00:00:00.000Z')).toBe('2026-03-01T00:00:00.000Z')
  })

  it("'custom' with no date returns null", () => {
    expect(resolveExpiresAt('custom', null)).toBeNull()
  })
})

describe('resolveExpirationError', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('every non-custom preset is always valid (no error)', () => {
    expect(resolveExpirationError('never', null)).toBeNull()
    expect(resolveExpirationError('7d', null)).toBeNull()
  })

  it('custom with no date is an error', () => {
    expect(resolveExpirationError('custom', null)).toBe('Choose an expiration date.')
  })

  it('custom with an unparseable date is an error', () => {
    expect(resolveExpirationError('custom', 'not-a-date')).toBe('Choose a valid date.')
  })

  it('custom with a past date is an error', () => {
    expect(resolveExpirationError('custom', '2026-01-01T00:00:00.000Z')).toBe('Choose a future date.')
  })

  it('custom with a future date has no error', () => {
    expect(resolveExpirationError('custom', '2026-06-01T00:00:00.000Z')).toBeNull()
  })
})

describe('toExpirationFormValue', () => {
  it('null (permanent) maps to the never preset', () => {
    expect(toExpirationFormValue(null)).toEqual({ preset: 'never', customDateIso: null })
  })

  it('a non-null expiresAt maps to the custom preset with that exact date', () => {
    expect(toExpirationFormValue('2026-02-01T00:00:00.000Z')).toEqual({
      preset: 'custom',
      customDateIso: '2026-02-01T00:00:00.000Z',
    })
  })
})
