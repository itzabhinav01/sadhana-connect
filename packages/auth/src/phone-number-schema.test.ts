import { describe, expect, it } from 'vitest'

import { optionalPhoneNumberField, phoneNumberField } from './phone-number-schema'

describe('phoneNumberField', () => {
  it('accepts a valid international phone number', () => {
    const result = phoneNumberField.safeParse('+919876543210')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }
  })

  it('automatically prefixes a 10-digit number with +91', () => {
    const result = phoneNumberField.safeParse('9876543210')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }
  })

  it('automatically prefixes a 10-digit number formatted with spaces or dashes', () => {
    const result = phoneNumberField.safeParse('98765 43210')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }

    const dashed = phoneNumberField.safeParse('98765-43210')
    expect(dashed.success).toBe(true)
    if (dashed.success) {
      expect(dashed.data).toBe('+919876543210')
    }
  })

  it('normalizes 11-digit Indian number starting with 0 to +91', () => {
    const result = phoneNumberField.safeParse('09876543210')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }
  })

  it('normalizes 12-digit Indian number starting with 91 without +', () => {
    const result = phoneNumberField.safeParse('919876543210')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }
  })

  it('preserves foreign country codes when explicitly entered', () => {
    const result = phoneNumberField.safeParse('+14155552671')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+14155552671')
    }
  })

  it('rejects an empty string', () => {
    expect(phoneNumberField.safeParse('').success).toBe(false)
  })

  it('rejects a value that is only whitespace', () => {
    expect(phoneNumberField.safeParse('   ').success).toBe(false)
  })

  it('rejects a number starting with +0', () => {
    expect(phoneNumberField.safeParse('+0123456789').success).toBe(false)
  })

  it('rejects a number that is too short', () => {
    expect(phoneNumberField.safeParse('12345').success).toBe(false)
  })

  it('trims surrounding whitespace before validating', () => {
    const result = phoneNumberField.safeParse('  +919876543210  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }
  })
})

describe('optionalPhoneNumberField', () => {
  it('accepts empty string as valid', () => {
    const result = optionalPhoneNumberField.safeParse('')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('')
    }
  })

  it('normalizes 10-digit number to +91', () => {
    const result = optionalPhoneNumberField.safeParse('9876543210')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }
  })
})
