import { describe, expect, it } from 'vitest'

import {
  isValidPhoneNumber,
  normalizePhoneNumber,
  normalizeWhatsAppNumber,
} from './phone-number'

describe('normalizePhoneNumber', () => {
  it('automatically adds +91 to a 10-digit Indian phone number', () => {
    expect(normalizePhoneNumber('9876543210')).toBe('+919876543210')
    expect(normalizePhoneNumber('8123456789')).toBe('+918123456789')
    expect(normalizePhoneNumber('7000012345')).toBe('+917000012345')
    expect(normalizePhoneNumber('6999988888')).toBe('+916999988888')
  })

  it('handles 10-digit numbers with spaces, dashes, or parentheses', () => {
    expect(normalizePhoneNumber('98765 43210')).toBe('+919876543210')
    expect(normalizePhoneNumber('98765-43210')).toBe('+919876543210')
    expect(normalizePhoneNumber('(98765) 43210')).toBe('+919876543210')
    expect(normalizePhoneNumber(' 98765 43210  ')).toBe('+919876543210')
  })

  it('handles 11-digit numbers starting with 0 by stripping 0 and adding +91', () => {
    expect(normalizePhoneNumber('09876543210')).toBe('+919876543210')
    expect(normalizePhoneNumber('0-98765-43210')).toBe('+919876543210')
  })

  it('handles 12-digit numbers starting with 91 by adding +', () => {
    expect(normalizePhoneNumber('919876543210')).toBe('+919876543210')
    expect(normalizePhoneNumber('91 98765 43210')).toBe('+919876543210')
  })

  it('preserves an existing +91 prefix and removes spaces', () => {
    expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210')
    expect(normalizePhoneNumber('+91 98765 43210')).toBe('+919876543210')
    expect(normalizePhoneNumber('+91-98765-43210')).toBe('+919876543210')
  })

  it('preserves foreign country codes when explicitly entered with +', () => {
    expect(normalizePhoneNumber('+1 (415) 555-2671')).toBe('+14155552671')
    expect(normalizePhoneNumber('+44 7911 123456')).toBe('+447911123456')
    expect(normalizePhoneNumber('+971 50 123 4567')).toBe('+971501234567')
    expect(normalizePhoneNumber('+61 412 345 678')).toBe('+61412345678')
  })

  it('preserves international prefix 00 by converting to +', () => {
    expect(normalizePhoneNumber('00919876543210')).toBe('+919876543210')
    expect(normalizePhoneNumber('0014155552671')).toBe('+14155552671')
  })

  it('returns empty string for null, undefined, or empty values', () => {
    expect(normalizePhoneNumber('')).toBe('')
    expect(normalizePhoneNumber('   ')).toBe('')
    expect(normalizePhoneNumber(null)).toBe('')
    expect(normalizePhoneNumber(undefined)).toBe('')
  })
})

describe('normalizeWhatsAppNumber', () => {
  it('returns digits with country code without leading + for 10-digit number', () => {
    expect(normalizeWhatsAppNumber('9876543210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('+919876543210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('09876543210')).toBe('919876543210')
  })

  it('returns digits for international numbers without leading +', () => {
    expect(normalizeWhatsAppNumber('+1 (415) 555-2671')).toBe('14155552671')
    expect(normalizeWhatsAppNumber('+44 7911 123456')).toBe('447911123456')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeWhatsAppNumber('')).toBe('')
    expect(normalizeWhatsAppNumber(null)).toBe('')
  })
})

describe('isValidPhoneNumber', () => {
  it('validates 10-digit numbers as valid (auto-prefixed with +91)', () => {
    expect(isValidPhoneNumber('9876543210')).toBe(true)
    expect(isValidPhoneNumber('09876543210')).toBe(true)
    expect(isValidPhoneNumber('919876543210')).toBe(true)
    expect(isValidPhoneNumber('+919876543210')).toBe(true)
  })

  it('validates international numbers as valid', () => {
    expect(isValidPhoneNumber('+14155552671')).toBe(true)
    expect(isValidPhoneNumber('+447911123456')).toBe(true)
  })

  it('rejects numbers that are too short or invalid', () => {
    expect(isValidPhoneNumber('123')).toBe(false)
    expect(isValidPhoneNumber('abc')).toBe(false)
    expect(isValidPhoneNumber('+0123456789')).toBe(false)
    expect(isValidPhoneNumber('')).toBe(false)
  })
})
