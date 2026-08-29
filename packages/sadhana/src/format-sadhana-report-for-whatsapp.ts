import type { SadhanaReport } from '@sadhana-connect/domain'
import { formatIsoDateAsDdMmYyyy, formatTime12Hour } from '@sadhana-connect/shared'

import { WHATSAPP_RECIPIENT_NUMBER } from './whatsapp-recipient'

// Placeholder for any unset nullable field (approved product decision,
// Phase 15) — the WhatsApp template's line structure must stay identical
// whether or not a given field was filled in, so a missing value renders
// as this dash rather than omitting its line.
const EMPTY_FIELD_PLACEHOLDER = '—'

function orDash(value: string | null): string {
  return value ?? EMPTY_FIELD_PLACEHOLDER
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
    `Date: ${formatIsoDateAsDdMmYyyy(report.reportDate)}`,
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
    orDash(report.signatureText),
  ]

  return lines.join('\n\n')
}

// The full share URL, including the fixed recipient (Phase 15 — not
// configurable) and the URL-encoded message. This is the only string a
// "Share to WhatsApp" action should ever be built from, on any platform.
export function buildWhatsAppShareUrl(report: SadhanaReport): string {
  const message = formatSadhanaReportForWhatsApp(report)
  return `https://wa.me/${WHATSAPP_RECIPIENT_NUMBER}?text=${encodeURIComponent(message)}`
}
