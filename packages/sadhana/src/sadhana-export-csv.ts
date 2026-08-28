import type { SadhanaReport } from '@sadhana-connect/domain'
import { formatTime12Hour } from '@sadhana-connect/shared'

// Excel/Sheets/Numbers all import a plain .csv as a spreadsheet natively
// — no xlsx-writer dependency needed for "open my sadhana data in
// Excel." Unlike the PDF/text exports (buildSadhanaReportExportSections),
// numeric columns here are left as bare numbers rather than "16 Rounds"
// strings, so a spreadsheet can actually sum/average them.
const CSV_HEADER = [
  'Date',
  'Rounds Before 4:30 AM',
  'Rounds Till 7 AM',
  'Last Round Time',
  'Total Rounds',
  'Reading Minutes',
  'Book Name',
  'Hearing Minutes',
  'Speaker Name',
  'Sleep Time',
  'Wake Up',
  'Day Rest (min)',
  'Total Rest (min)',
  'Office Going',
  'Office Return',
  'Notes',
  'Signature',
]

// RFC 4180: a field is quoted (with internal quotes doubled) only when it
// contains a comma, quote, or newline — everything else is left bare for
// a smaller, more readable file.
function csvField(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function reportToRow(report: SadhanaReport): string {
  return [
    report.reportDate,
    report.roundsBefore430,
    report.roundsTill7am,
    formatTime12Hour(report.lastRoundTime),
    report.totalRounds,
    report.readingMinutes,
    report.bookName ?? '',
    report.hearingMinutes,
    report.speakerName ?? '',
    formatTime12Hour(report.sleepTime),
    formatTime12Hour(report.wakeTime),
    report.dayRestMinutes,
    report.totalRestMinutes,
    formatTime12Hour(report.officeGoingTime),
    formatTime12Hour(report.officeReturnTime),
    report.notes ?? '',
    report.signatureText,
  ]
    .map(csvField)
    .join(',')
}

// CRLF line endings (`\r\n`) — the RFC 4180 convention Excel expects;
// LF-only still opens fine but CRLF avoids any doubt. Oldest -> newest,
// regardless of the order `reports` arrives in, matching
// formatSadhanaReportsRangeForText's same sorting guarantee.
export function buildSadhanaHistoryCsv(reports: SadhanaReport[]): string {
  const sorted = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))
  const rows = [CSV_HEADER.map(csvField).join(','), ...sorted.map(reportToRow)]
  return rows.join('\r\n')
}
