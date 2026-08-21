// Expiration presets offered by the creation/edit form (section 17).
// 'never' -> announcements.expires_at = NULL (permanent, matches the
// domain semantics documented on Announcement.expiresAt). 'custom' lets
// the author pick an exact date; every other preset resolves to "now +
// N days" at the moment of submission.
export const ANNOUNCEMENT_EXPIRATION_PRESETS = [
  'never',
  '1d',
  '3d',
  '7d',
  '14d',
  '30d',
  'custom',
] as const

export type AnnouncementExpirationPreset = (typeof ANNOUNCEMENT_EXPIRATION_PRESETS)[number]

export const ANNOUNCEMENT_EXPIRATION_PRESET_LABELS: Record<AnnouncementExpirationPreset, string> = {
  never: 'Never',
  '1d': '1 day',
  '3d': '3 days',
  '7d': '7 days',
  '14d': '14 days',
  '30d': '30 days',
  custom: 'Custom date',
}

const PRESET_DAYS: Record<'1d' | '3d' | '7d' | '14d' | '30d', number> = {
  '1d': 1,
  '3d': 3,
  '7d': 7,
  '14d': 14,
  '30d': 30,
}

// Returns the exact ISO expires_at to send to the repository, or null for
// a permanent announcement. For 'custom', customDateIso is expected to
// already be a valid future date (validated by the form before calling
// this — see resolveExpirationError below).
export function resolveExpiresAt(
  preset: AnnouncementExpirationPreset,
  customDateIso: string | null,
): string | null {
  if (preset === 'never') return null
  if (preset === 'custom') return customDateIso
  const resolved = new Date()
  resolved.setDate(resolved.getDate() + PRESET_DAYS[preset])
  return resolved.toISOString()
}

// Manual validation, matching this codebase's existing pattern for
// form-adjacent-but-not-Zod-schema fields (see AdminAnnouncementForm's
// own scopeError check for the temple-group picker).
export function resolveExpirationError(
  preset: AnnouncementExpirationPreset,
  customDateIso: string | null,
): string | null {
  if (preset !== 'custom') return null
  if (!customDateIso) return 'Choose an expiration date.'
  if (Number.isNaN(new Date(customDateIso).getTime())) return 'Choose a valid date.'
  if (new Date(customDateIso).getTime() <= Date.now()) return 'Choose a future date.'
  return null
}

// Derives the preset + custom-date form fields back from a stored
// Announcement.expiresAt, for the edit form's initial state — always
// 'custom' when non-null (there is no way to know which preset an
// existing value originally came from, and it doesn't matter: the stored
// date is authoritative either way).
export function toExpirationFormValue(expiresAt: string | null): {
  preset: AnnouncementExpirationPreset
  customDateIso: string | null
} {
  if (expiresAt === null) return { preset: 'never', customDateIso: null }
  return { preset: 'custom', customDateIso: expiresAt }
}
