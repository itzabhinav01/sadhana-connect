import { buildSadhanaReportExportSections } from '@/application/sadhana/sadhana-export-fields'
import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { formatIsoDateAsDdMmYyyy } from '@/shared/utils/date'

type SadhanaExportPrintViewProps =
  | { mode: 'single'; report: SadhanaReport }
  | { mode: 'range'; reports: SadhanaReport[]; fromDate: string; toDate: string }

const NO_REPORTS_MESSAGE = 'No Sadhana reports were submitted in this date range.'

// break-inside-avoid keeps a single field-section (e.g. "Chanting") from
// splitting across a page boundary where it fits on one page; it is
// intentionally NOT applied to the whole multi-section report, so a
// report that genuinely doesn't fit can still flow onto the next page
// instead of being forced there wholesale and leaving a large blank gap
// (approved product decision, Phase 16 — "avoid huge blank areas").
function ReportSections({ report }: { report: SadhanaReport }) {
  return (
    <>
      <h2 className="text-base font-semibold">
        Date: {formatIsoDateAsDdMmYyyy(report.reportDate)}
      </h2>
      {buildSadhanaReportExportSections(report).map((section) => (
        <section key={section.title} className="mt-3 break-inside-avoid">
          <h3 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {section.title}
          </h3>
          <dl className="mt-1">
            {section.fields.map((field, index) =>
              field.label ? (
                <div
                  key={field.label}
                  className="flex justify-between gap-4 border-b border-neutral-200 py-1 text-sm"
                >
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ) : (
                <p key={index} className="py-1 text-sm whitespace-pre-wrap">
                  {field.value}
                </p>
              ),
            )}
          </dl>
        </section>
      ))}
    </>
  )
}

// Rendered permanently in the DOM but invisible on screen (`hidden`) —
// revealed only under @media print via the global .sadhana-print-view
// rule in index.css, which also hides the rest of the app shell
// (sidebar/header) so only this document appears in the printed output.
//
// Colors are hardcoded to black-on-white rather than the app's
// theme-aware design tokens (text-foreground, etc.) — those tokens
// resolve to near-white text under the app's dark theme, which would be
// illegible if printed as-is regardless of what theme the devotee has
// active on screen. A printed document is always light, on purpose.
//
// Page numbers were considered ("if achievable without introducing
// dependencies") but are not implemented: CSS Paged Media running page
// counters (@page { @bottom-center { content: counter(page) } }) are not
// supported by any current browser's print engine, so there is no
// dependency-free way to add them.
export function SadhanaExportPrintView(props: SadhanaExportPrintViewProps) {
  return (
    <div className="sadhana-print-view hidden font-serif text-black print:block">
      {props.mode === 'single' ? (
        <>
          <h1 className="text-xl font-bold">Sadhana Report</h1>
          <div className="mt-4 break-inside-avoid">
            <ReportSections report={props.report} />
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold">Sadhana Reports</h1>
          <p className="mt-1 text-sm">
            Date Range: {formatIsoDateAsDdMmYyyy(props.fromDate)} to{' '}
            {formatIsoDateAsDdMmYyyy(props.toDate)}
          </p>

          {props.reports.length === 0 ? (
            <p className="mt-6 text-sm">{NO_REPORTS_MESSAGE}</p>
          ) : (
            <div className="mt-6 flex flex-col divide-y divide-neutral-300">
              {[...props.reports]
                .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
                .map((report) => (
                  <div key={report.id} className="break-inside-avoid py-6 first:pt-0">
                    <ReportSections report={report} />
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
