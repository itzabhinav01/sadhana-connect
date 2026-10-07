// Phone number normalization and validation utilities.
// Default country code is India (+91).
// If a user enters a 10-digit number without a country code, or with a leading 0
// or 91 without '+', it is automatically normalized to +91XXXXXXXXXX.
// If an international country code is explicitly provided (with '+' or '00'),
// that country code is preserved.

export const DEFAULT_COUNTRY_CODE = '+91'

// Standard E.164 pattern required by profiles_phone_number_format database check constraint.
export const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{6,14}$/

/**
 * Normalizes any phone number input into standard E.164 international format (+XXXXXXXXXX).
 * - 10-digit numbers (common Indian format) automatically get +91 prepended.
 * - 11-digit numbers starting with 0 (Indian trunk dialing) drop 0 and get +91 prepended.
 * - 12-digit numbers starting with 91 (Indian number without +) get + prepended.
 * - Numbers with explicit '+' or '00' preserve their respective country code.
 */
export function normalizePhoneNumber(raw?: string | null): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''

  // Explicit international '+' prefix
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '')
    return digits ? `+${digits}` : ''
  }

  // International call prefix '00' (e.g. 0091... or 001...)
  if (trimmed.startsWith('00')) {
    const digits = trimmed.slice(2).replace(/\D/g, '')
    return digits ? `+${digits}` : ''
  }

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''

  // 10 digits: standard Indian mobile number without country code
  if (digits.length === 10) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`
  }

  // 11 digits starting with 0: Indian trunk dialing (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`
  }

  // 12 digits starting with 91: Indian number entered without '+'
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`
  }

  // Other digits without explicit country prefix: prepend '+'
  return `+${digits}`
}

/**
 * Normalizes a phone number for WhatsApp wa.me links.
 * WhatsApp wa.me URLs require digits only with country code, without the leading '+'.
 */
export function normalizeWhatsAppNumber(phoneNumber?: string | null): string {
  const normalized = normalizePhoneNumber(phoneNumber)
  return normalized.replace(/^\+/, '')
}

/**
 * Validates whether a phone number (after normalization) matches the standard E.164 format.
 */
export function isValidPhoneNumber(phoneNumber?: string | null): boolean {
  const normalized = normalizePhoneNumber(phoneNumber)
  return PHONE_NUMBER_PATTERN.test(normalized)
}
