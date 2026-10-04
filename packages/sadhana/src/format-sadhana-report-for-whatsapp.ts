import type { SadhanaReport } from '@sadhana-connect/domain'
import { formatIsoDateAsDdMmYyyy, formatTime12Hour } from '@sadhana-connect/shared'

import {
  WHATSAPP_RECIPIENT_NUMBER,
  getConfiguredWhatsAppRecipient,
  normalizeWhatsAppNumber,
} from './whatsapp-recipient'

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

// Builds the full WhatsApp share URL using the user's configured recipient
// number (from Profile) when present, or https://wa.me/?text=... when unset
// so WhatsApp opens its contact/group picker with the report pre-filled.
export function buildWhatsAppShareUrl(
  report: SadhanaReport,
  recipientNumber?: string | null,
): string {
  const message = formatSadhanaReportForWhatsApp(report)
  const effectiveRecipient =
    recipientNumber !== undefined
      ? recipientNumber
      : (getConfiguredWhatsAppRecipient() ?? WHATSAPP_RECIPIENT_NUMBER)
  const digits = normalizeWhatsAppNumber(effectiveRecipient)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
