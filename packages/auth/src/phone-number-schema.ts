import { z } from 'zod'
import {
  DEFAULT_COUNTRY_CODE,
  PHONE_NUMBER_PATTERN,
  isValidPhoneNumber,
  normalizePhoneNumber,
  normalizeWhatsAppNumber,
} from '@sadhana-connect/shared'

export {
  DEFAULT_COUNTRY_CODE,
  PHONE_NUMBER_PATTERN,
  isValidPhoneNumber,
  normalizePhoneNumber,
  normalizeWhatsAppNumber,
}

// Compulsory phone number field with automatic India (+91) defaulting.
// If a user enters a 10-digit number without country code, it is automatically
// prefixed with +91 (e.g. 9876543210 -> +919876543210) while preserving
// any explicitly entered international country code.
//
// Uses z.string().transform().pipe() so input and output types are both strictly string,
// preventing Zod input type from becoming 'unknown' in react-hook-form / zodResolver.
export const phoneNumberField = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .transform((val) => normalizePhoneNumber(val))
  .pipe(
    z
      .string()
      .regex(
        PHONE_NUMBER_PATTERN,
        'Enter a valid phone number (e.g. 9876543210 or +919876543210)',
      ),
  )

// Optional phone number field (e.g. for WhatsApp Share Number in profile)
// Allows empty string, or normalizes 10-digit numbers to +91.
export const optionalPhoneNumberField = z
  .string()
  .trim()
  .transform((val) => (val ? normalizePhoneNumber(val) : ''))
  .pipe(
    z
      .string()
      .refine(
        (val) => val === '' || PHONE_NUMBER_PATTERN.test(val),
        'Enter a valid phone number (e.g. 9876543210 or +919876543210)',
      ),
  )
