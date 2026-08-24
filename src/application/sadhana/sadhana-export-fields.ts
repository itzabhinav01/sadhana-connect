import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { formatTime12Hour } from '@/shared/utils/format-time-12-hour'

// Placeholder for any unset nullable field in an export (Phase 16,
// approved product decision) — matches the Sadhana app's existing display
// convention (see format-sadhana-report-for-whatsapp.ts, Phase 15) rather
// than the "XXX"/"TIME" illustrative placeholders from CLAUDE.md's
// template text.
const EMPTY_FIELD_PLACEHOLDER = '—'

function orDash(value: string | null): string {
  return value ?? EMPTY_FIELD_PLACEHOLDER
}

export interface SadhanaExportField {
  // null label = a bare, unlabeled value (used for Notes/Signature, where
  // the section heading already names the field — repeating it as a
  // "Notes: ..." prefix would be redundant).
  label: string | null
  value: string
}

export interface SadhanaExportSection {
  title: string
  fields: SadhanaExportField[]
}

// The single source of truth for which SadhanaReport fields appear in a
// PDF/Text export, their section grouping, their labels, and their
// formatting — consumed by both format-sadhana-report-for-text.ts and
// SadhanaExportPrintView.tsx so the two can never drift apart.
//
// Units are deliberately consistent throughout (always "min" for a
// minutes-valued field) rather than reusing the WhatsApp template's
// inherited inconsistency (Phase 15 preserves "Read :- X min" / "Hearing
// :- X Mins" / "Total Rest :- X hr" verbatim because CLAUDE.md mandates
// that template byte-for-byte). This is a new, standalone document, not
// a reproduction of that template, and dayRestMinutes/totalRestMinutes
// are literally minutes-valued columns (see 0001_initial_schema.sql and
// the form's own "(minutes)" labels) — labelling totalRestMinutes as
// "hr" here would be factually wrong on a "professional and readable"
// document.
export function buildSadhanaReportExportSections(
  report: SadhanaReport,
): SadhanaExportSection[] {
  return [
    {
      title: 'Chanting',
      fields: [
        { label: 'Rounds before 4:30 AM', value: `${report.roundsBefore430} Rounds` },
        { label: 'Rounds till 7 AM', value: `${report.roundsTill7am} Rounds` },
        { label: 'Last Round Time', value: formatTime12Hour(report.lastRoundTime) },
        { label: 'Total Rounds', value: `${report.totalRounds} Rounds` },
      ],
    },
    {
      title: 'Reading',
      fields: [
        { label: 'Reading Minutes', value: `${report.readingMinutes} min` },
        { label: 'Book Name', value: orDash(report.bookName) },
      ],
    },
    {
      title: 'Hearing',
      fields: [
        { label: 'Hearing Minutes', value: `${report.hearingMinutes} min` },
        { label: 'Speaker Name', value: orDash(report.speakerName) },
      ],
    },
    {
      title: 'Rest & Sleep',
      fields: [
        { label: 'Sleep Time', value: formatTime12Hour(report.sleepTime) },
        { label: 'Wake Up', value: formatTime12Hour(report.wakeTime) },
        { label: 'Day Rest', value: `${report.dayRestMinutes} min` },
        { label: 'Total Rest', value: `${report.totalRestMinutes} min` },
      ],
    },
    {
      title: 'Schedule',
      fields: [
        { label: 'Office Going', value: formatTime12Hour(report.officeGoingTime) },
        { label: 'Office Return', value: formatTime12Hour(report.officeReturnTime) },
      ],
    },
    {
      title: 'Notes',
      fields: [{ label: null, value: orDash(report.notes) }],
    },
    {
      title: 'Signature',
      fields: [{ label: null, value: report.signatureText }],
    },
  ]
}
