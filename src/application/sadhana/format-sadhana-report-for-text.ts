import {
  buildSadhanaReportExportSections,
  type SadhanaExportSection,
} from '@/application/sadhana/sadhana-export-fields'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { formatIsoDateAsDdMmYyyy } from '@/shared/utils/date'

const NO_REPORTS_MESSAGE = 'No Sadhana reports were submitted in this date range.'

function sectionToText(section: SadhanaExportSection): string {
  const lines = section.fields.map((field) =>
    field.label ? `${field.label}: ${field.value}` : field.value,
  )
  return [section.title, ...lines].join('\n')
}

// 'Date: DD-MM-YYYY' plus every section, blank-line separated — the body
// shared by both a standalone single-report export and each entry in a
// range export.
function buildReportBody(report: SadhanaReport): string {
  const blocks = [
    `Date: ${formatIsoDateAsDdMmYyyy(report.reportDate)}`,
    ...buildSadhanaReportExportSections(report).map(sectionToText),
  ]
  return blocks.join('\n\n')
}

// Standalone professional text format (approved product decision, Phase
// 16) — deliberately does not reuse the WhatsApp greeting/template
// (Phase 15's format-sadhana-report-for-whatsapp.ts). This is a personal
// record document, not a message to a recipient.
export function formatSadhanaReportForText(report: SadhanaReport): string {
  return `SADHANA REPORT\n${buildReportBody(report)}`
}

const RANGE_ENTRY_SEPARATOR = `\n\n${'-'.repeat(40)}\n\n`

// One complete report section per submitted day, oldest -> newest,
// regardless of the order `reports` arrives in — sorted here so this
// function's output is correct even if a caller passes an unsorted array,
// rather than trusting every call site to have sorted it first.
export function formatSadhanaReportsRangeForText(
  reports: SadhanaReport[],
  fromDate: string,
  toDate: string,
): string {
  const header = `SADHANA REPORTS\nDate Range: ${formatIsoDateAsDdMmYyyy(fromDate)} to ${formatIsoDateAsDdMmYyyy(toDate)}`

  if (reports.length === 0) {
    return `${header}\n\n${NO_REPORTS_MESSAGE}`
  }

  const sorted = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))
  const body = sorted.map(buildReportBody).join(RANGE_ENTRY_SEPARATOR)

  return `${header}\n\n${body}`
}
