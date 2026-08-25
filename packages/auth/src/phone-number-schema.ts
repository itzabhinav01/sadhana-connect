import { z } from 'zod'

// Mirrors profiles_phone_number_format exactly (0014) — international,
// '+' country code required (approved format). Shared by registration
// and the Profile page's own phone-number field so both stay in sync
// with the one authoritative pattern.
export const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{6,14}$/

export const phoneNumberField = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .regex(PHONE_NUMBER_PATTERN, 'Enter a valid phone number with country code, e.g. +919876543210')
