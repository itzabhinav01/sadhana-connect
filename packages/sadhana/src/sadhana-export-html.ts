import type { SadhanaReport } from '@sadhana-connect/domain'
import { formatIsoDateAsDdMmYyyy } from '@sadhana-connect/shared'

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

function sectionToHtml(section: SadhanaExportSection): string {
  const fields = section.fields
    .map((field) =>
      field.label
        ? `<div class="field"><span class="label">${escapeHtml(field.label)}</span><span class="value">${escapeHtml(field.value)}</span></div>`
        : `<p class="bare-value">${escapeHtml(field.value)}</p>`,
    )
    .join('')

  return `<section><h3>${escapeHtml(section.title)}</h3>${fields}</section>`
}

// A standalone HTML document for expo-print's printToFileAsync — the
// mobile equivalent of web's SadhanaExportPrintView (Phase 16), built
// from the same buildSadhanaReportExportSections source of truth so the
// two documents' content can never drift apart. Native has no browser
// print API, so this is rendered to a real PDF file via expo-print
// rather than relying on @media print.
export function buildSadhanaReportHtml(report: SadhanaReport): string {
  const sectionsHtml = buildSadhanaReportExportSections(report).map(sectionToHtml).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; color: #000; background: #fff; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      h2 { font-size: 14px; font-weight: 600; margin: 0 0 16px; }
      section { margin-top: 12px; }
      h3 { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #666; margin: 0 0 4px; }
      .field { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e5e5e5; padding: 4px 0; font-size: 13px; }
      .bare-value { padding: 4px 0; font-size: 13px; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <h1>Sadhana Report</h1>
    <h2>Date: ${escapeHtml(formatIsoDateAsDdMmYyyy(report.reportDate))}</h2>
    ${sectionsHtml}
  </body>
</html>`
}
