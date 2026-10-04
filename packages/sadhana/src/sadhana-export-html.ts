import type { SadhanaReport } from '@sadhana-connect/domain'
import { formatIsoDateAsDdMmYyyy, formatTime12Hour } from '@sadhana-connect/shared'

import { buildSadhanaReportExportSections, type SadhanaExportSection } from './sadhana-export-fields'

// Free-text report fields (book name, speaker name, notes, signature) are
// rendered verbatim into this HTML string before it's handed to
// expo-print, so every value must be escaped here — there is no JSX
// layer doing it for us the way there is on web's SadhanaExportPrintView.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sectionToHtml(section: SadhanaExportSection, report: SadhanaReport): string {
  const fields = section.fields
    .map((field) => {
      if (!field.label) {
        return `<p class="bare-value">${escapeHtml(field.value)}</p>`
      }
      const isTotalRounds = field.label === 'Total rounds chanted'
      const valueClass = isTotalRounds
        ? report.totalRounds < 16
          ? 'value rounds-low'
          : 'value rounds-ok'
        : 'value'
      return `<div class="field"><span class="label">${escapeHtml(field.label)}</span><span class="${valueClass}">${escapeHtml(field.value)}</span></div>`
    })
    .join('')

  return `<section class="section-card"><h3>${escapeHtml(section.title)}</h3>${fields}</section>`
}

function buildSummarySheetTableHtml(sorted: SadhanaReport[]): string {
  if (sorted.length === 0) return ''

  const count = sorted.length
  const totalRounds = sorted.reduce((acc, r) => acc + r.totalRounds, 0)
  const totalBefore430 = sorted.reduce((acc, r) => acc + r.roundsBefore430, 0)
  const totalTill7am = sorted.reduce((acc, r) => acc + r.roundsTill7am, 0)
  const totalRead = sorted.reduce((acc, r) => acc + r.readingMinutes, 0)
  const totalHear = sorted.reduce((acc, r) => acc + r.hearingMinutes, 0)
  const daysBelow16 = sorted.filter((r) => r.totalRounds < 16).length
  const daysMet16 = count - daysBelow16

  const rowsHtml = sorted
    .map((r) => {
      const isBelow16 = r.totalRounds < 16
      const roundsClass = isBelow16 ? 'cell-low' : 'cell-ok'
      const statusLabel = isBelow16 ? `Below 16 (${r.totalRounds}/16)` : '16+ Target Met'
      const wakeSleep =
        r.wakeTime || r.sleepTime
          ? `${r.wakeTime ? formatTime12Hour(r.wakeTime) : '—'} / ${r.sleepTime ? formatTime12Hour(r.sleepTime) : '—'}`
          : '—'
      return `<tr>
        <td class="cell-center">${escapeHtml(formatIsoDateAsDdMmYyyy(r.reportDate))}</td>
        <td class="cell-center">${r.roundsBefore430}</td>
        <td class="cell-center">${r.roundsTill7am}</td>
        <td class="cell-center ${roundsClass}">${r.totalRounds}</td>
        <td class="cell-center ${roundsClass}">${escapeHtml(statusLabel)}</td>
        <td class="cell-center">${r.readingMinutes}m</td>
        <td class="cell-center">${r.hearingMinutes}m</td>
        <td class="cell-center">${escapeHtml(wakeSleep)}</td>
      </tr>`
    })
    .join('')

  return `
    <div class="summary-sheet-wrapper">
      <div class="summary-pills">
        <span class="pill pill-neutral">Reported Days: <strong>${count}</strong></span>
        <span class="pill pill-ok">16+ Rounds Days: <strong>${daysMet16}</strong></span>
        <span class="pill ${daysBelow16 > 0 ? 'pill-low' : 'pill-ok'}">Below 16 Rounds (&lt;16): <strong>${daysBelow16}</strong></span>
        <span class="pill pill-neutral">Avg Rounds: <strong>${(totalRounds / count).toFixed(1)}</strong></span>
      </div>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Report Date</th>
            <th>Before 4:30</th>
            <th>4:30–7:00</th>
            <th>Total Japa</th>
            <th>Japa Status</th>
            <th>Read</th>
            <th>Hear</th>
            <th>Wake / Sleep</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr class="summary-footer-row">
            <td><strong>Average / Day</strong></td>
            <td class="cell-center"><strong>${(totalBefore430 / count).toFixed(1)}</strong></td>
            <td class="cell-center"><strong>${(totalTill7am / count).toFixed(1)}</strong></td>
            <td class="cell-center"><strong>${(totalRounds / count).toFixed(1)}</strong></td>
            <td class="cell-center"><strong>${daysMet16}/${count} Met 16+</strong></td>
            <td class="cell-center"><strong>${Math.round(totalRead / count)}m</strong></td>
            <td class="cell-center"><strong>${Math.round(totalHear / count)}m</strong></td>
            <td class="cell-center">—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `
}

const DOCUMENT_STYLE = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Georgia, serif; color: #0f172a; background: #fff; padding: 24px; line-height: 1.45; }
      .doc-header { border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 16px; }
      h1 { font-size: 22px; color: #9a3412; margin: 0 0 4px; }
      h2 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 10px; padding: 6px 10px; background: #f8fafc; border-left: 4px solid #d97706; border-radius: 4px; }
      section.section-card { margin-top: 10px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
      h3 { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; background: #f1f5f9; margin: 0; padding: 5px 10px; border-bottom: 1px solid #cbd5e1; }
      .field { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-bottom: 1px solid #e2e8f0; padding: 5px 10px; font-size: 12.5px; }
      .field:last-child { border-bottom: none; }
      .label { color: #334155; }
      .value { font-weight: 600; color: #0f172a; }
      .rounds-low { background-color: #fef2f2; color: #dc2626; font-weight: 700; border: 1px solid #fca5a5; padding: 1px 8px; border-radius: 4px; }
      .rounds-ok { background-color: #f0fdf4; color: #15803d; font-weight: 700; border: 1px solid #86efac; padding: 1px 8px; border-radius: 4px; }
      .bare-value { padding: 6px 10px; margin: 0; font-size: 12.5px; white-space: pre-wrap; color: #1e293b; }
      .report-block { margin-top: 20px; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; page-break-inside: avoid; }
      .report-block:first-of-type { margin-top: 12px; }
      .summary-sheet-wrapper { margin: 16px 0 24px; }
      .summary-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
      .pill { font-size: 11.5px; padding: 4px 10px; border-radius: 999px; border: 1px solid #cbd5e1; }
      .pill-neutral { background: #f8fafc; color: #334155; }
      .pill-ok { background: #f0fdf4; color: #15803d; border-color: #86efac; }
      .pill-low { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
      table.summary-table { width: 100%; border-collapse: collapse; font-size: 11.5px; border: 1px solid #94a3b8; }
      table.summary-table th { background: #fffbeb; color: #9a3412; font-weight: 700; text-align: center; padding: 6px 6px; border: 1px solid #94a3b8; }
      table.summary-table td { padding: 5px 6px; border: 1px solid #cbd5e1; }
      .cell-center { text-align: center; }
      .cell-low { background-color: #fef2f2; color: #dc2626; font-weight: 700; }
      .cell-ok { background-color: #f0fdf4; color: #15803d; font-weight: 700; }
      .summary-footer-row td { background: #f1f5f9; border-top: 2px solid #64748b; }
`

// A standalone HTML document for expo-print's printToFileAsync — the
// mobile equivalent of web's SadhanaExportPrintView (Phase 16), built
// from the same buildSadhanaReportExportSections source of truth so the
// two documents' content can never drift apart. Native has no browser
// print API, so this is rendered to a real PDF file via expo-print
// rather than relying on @media print.
export function buildSadhanaReportHtml(report: SadhanaReport): string {
  const sectionsHtml = buildSadhanaReportExportSections(report)
    .map((section) => sectionToHtml(section, report))
    .join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${DOCUMENT_STYLE}</style>
  </head>
  <body>
    <div class="doc-header">
      <h1>Sadhana Report</h1>
    </div>
    <h2>Date: ${escapeHtml(formatIsoDateAsDdMmYyyy(report.reportDate))}</h2>
    ${sectionsHtml}
  </body>
</html>`
}

const NO_REPORTS_MESSAGE = 'No Sadhana reports were submitted in this date range.'

// Mobile equivalent of web's SadhanaExportPrintView 'range' mode: one
// full report (same sections as the single-report export) per day,
// oldest -> newest, regardless of the order `reports` arrives in.
export function buildSadhanaHistoryHtml(
  reports: SadhanaReport[],
  fromDate: string,
  toDate: string,
  devoteeName?: string,
): string {
  const sorted = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))

  const summaryTableHtml = buildSummarySheetTableHtml(sorted)

  const bodyHtml =
    sorted.length === 0
      ? `<p>${escapeHtml(NO_REPORTS_MESSAGE)}</p>`
      : `${summaryTableHtml}${sorted
          .map(
            (report) => `<div class="report-block">
              <h2>Date: ${escapeHtml(formatIsoDateAsDdMmYyyy(report.reportDate))}</h2>
              ${buildSadhanaReportExportSections(report)
                .map((section) => sectionToHtml(section, report))
                .join('')}
            </div>`,
          )
          .join('')}`

  const devoteeHeader = devoteeName
    ? `<p style="margin: 0 0 4px; font-weight: bold; font-size: 15px;">Devotee: ${escapeHtml(devoteeName)}</p>`
    : ''

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${DOCUMENT_STYLE}</style>
  </head>
  <body>
    <div class="doc-header">
      <h1>Sadhana Reports</h1>
      ${devoteeHeader}
      <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">Date Range: ${escapeHtml(formatIsoDateAsDdMmYyyy(fromDate))} to ${escapeHtml(formatIsoDateAsDdMmYyyy(toDate))}</p>
    </div>
    ${bodyHtml}
  </body>
</html>`
}

