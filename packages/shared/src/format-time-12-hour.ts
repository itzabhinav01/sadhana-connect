// Shared by the WhatsApp share formatter (Phase 15) and the PDF/Text
// export formatters (Phase 16) — one implementation so "the same 12-hour
// formatting as Phase 15" can never drift between the two features.
//
// Time fields arrive as 'HH:mm' (or 'HH:mm:ss' — Postgres time columns
// serialize with seconds) and are display-only conversions: string
// parsing only, no Date object, so there is no timezone involved at all.
// This never feeds back into storage or any form input.
const EMPTY_TIME_PLACEHOLDER = '—'

export function formatTime12Hour(time: string | null | undefined): string {
  if (!time) return EMPTY_TIME_PLACEHOLDER

  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minuteStr} ${period}`
}
