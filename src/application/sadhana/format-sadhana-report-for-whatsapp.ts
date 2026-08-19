import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { WHATSAPP_RECIPIENT_NUMBER } from '@/shared/constants/whatsapp'

// Placeholder for any unset nullable field (approved product decision,
// Phase 15) — the WhatsApp template's line structure must stay identical
// whether or not a given field was filled in, so a missing value renders
// as this dash rather than omitting its line.
const EMPTY_FIELD_PLACEHOLDER = '—'

function orDash(value: string | null): string {
  return value ?? EMPTY_FIELD_PLACEHOLDER
}

// Time fields arrive as 'HH:mm' (or 'HH:mm:ss' — Postgres time columns
// serialize with seconds; the Sadhana form's own 'HH:mm' input behavior is
// untouched by this) and render in the WhatsApp message as 12-hour
// clock time (approved product decision, Phase 15) — the message is a
// devotional greeting read by a person, not a form value, so this is
// display-only and never feeds back into storage or the form. String
// parsing only, no Date object, so there is no timezone involved at all.
function formatTime12Hour(time: string | null): string {
  if (!time) return EMPTY_FIELD_PLACEHOLDER

  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minuteStr} ${period}`
}

// 'YYYY-MM-DD' -> 'DD-MM-YYYY', by string manipulation only (no Date
// object) — same reasoning as addDaysIso in shared/utils/date.ts: this
// avoids any timezone-parsing pitfall entirely, since reportDate is
// already a plain calendar-date string.
function toDdMmYyyy(reportDate: string): string {
  const [year, month, day] = reportDate.split('-')
  return `${day}-${month}-${year}`
}

// Builds the exact WhatsApp sadhana-chart message from CLAUDE.md's
// WHATSAPP SHARE section, verbatim — wording, line ordering, blank lines
// between fields, capitalization, emoji, and punctuation must never be
// "cleaned up" or rewritten here. Any future change to the template
// belongs in CLAUDE.md first, then here to match, never the reverse.
export function formatSadhanaReportForWhatsApp(report: SadhanaReport): string {
  const lines = [
    'Hare Krishna prabhuji',
    'Dandvat pranam🙇‍♂️ 🙏',
    '*My Sadhna chart Dated for*',
    `Date: ${toDdMmYyyy(report.reportDate)}`,
    `Chant B4 4:30 Am :- ${report.roundsBefore430} Rounds`,
    `Till 7:00 am :- ${report.roundsTill7am} Rounds`,
    `Last Round :- ${formatTime12Hour(report.lastRoundTime)}`,
    `Total Round :- ${report.totalRounds} Rounds`,
    `Read :- ${report.readingMinutes} min`,
    `Book Name :- ${orDash(report.bookName)}`,
    `Hearing :- ${report.hearingMinutes} Mins`,
    `Speaker Name :- ${orDash(report.speakerName)}`,
    `Slept at(last night) :- ${formatTime12Hour(report.sleepTime)}`,
    `Wake up :- ${formatTime12Hour(report.wakeTime)}`,
    `Day Rest :- ${report.dayRestMinutes} mins`,
    `Total Rest :- ${report.totalRestMinutes} hr`,
    `Office going :- ${formatTime12Hour(report.officeGoingTime)}`,
    `Reaching back :- ${formatTime12Hour(report.officeReturnTime)}`,
    'Ys',
    report.signatureText,
  ]

  return lines.join('\n\n')
}

// The full share URL, including the fixed recipient (Phase 15 — not
// configurable) and the URL-encoded message. This is the only string a
// "Share to WhatsApp" link's href should ever be built from.
export function buildWhatsAppShareUrl(report: SadhanaReport): string {
  const message = formatSadhanaReportForWhatsApp(report)
  return `https://wa.me/${WHATSAPP_RECIPIENT_NUMBER}?text=${encodeURIComponent(message)}`
}
