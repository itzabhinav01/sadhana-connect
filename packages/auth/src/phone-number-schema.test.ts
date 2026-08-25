import { describe, expect, it } from 'vitest'

import { phoneNumberField } from './phone-number-schema'

describe('phoneNumberField', () => {
  it('accepts a valid international phone number', () => {
    expect(phoneNumberField.safeParse('+919876543210').success).toBe(true)
  })

  it('rejects a number missing the + country code', () => {
    expect(phoneNumberField.safeParse('919876543210').success).toBe(false)
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

  it('rejects a number containing non-digit characters', () => {
    expect(phoneNumberField.safeParse('+91-987-654-3210').success).toBe(false)
  })

  it('trims surrounding whitespace before validating', () => {
    const result = phoneNumberField.safeParse('  +919876543210  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+919876543210')
    }
  })
})
