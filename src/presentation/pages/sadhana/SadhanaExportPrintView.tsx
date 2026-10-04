import { buildSadhanaReportExportSections } from '@sadhana-connect/sadhana'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { formatIsoDateAsDdMmYyyy, formatTime12Hour } from '@sadhana-connect/shared'

export type SadhanaExportPrintViewProps =
  | { mode: 'single'; report: SadhanaReport; devoteeName?: string }
  | { mode: 'range'; reports: SadhanaReport[]; fromDate: string; toDate: string; devoteeName?: string }

export const NO_REPORTS_MESSAGE = 'No Sadhana reports were submitted in this date range.'

export function SadhanaSummarySheetTable({ reports }: { reports: SadhanaReport[] }) {
  if (reports.length === 0) return null

  const sorted = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))
  const count = sorted.length
  const totalRounds = sorted.reduce((acc, r) => acc + r.totalRounds, 0)
  const totalBefore430 = sorted.reduce((acc, r) => acc + r.roundsBefore430, 0)
  const totalTill7am = sorted.reduce((acc, r) => acc + r.roundsTill7am, 0)
  const totalRead = sorted.reduce((acc, r) => acc + r.readingMinutes, 0)
  const totalHear = sorted.reduce((acc, r) => acc + r.hearingMinutes, 0)
  const daysBelow16 = sorted.filter((r) => r.totalRounds < 16).length
  const daysMet16 = count - daysBelow16

  return (
    <div className="my-4 flex flex-col gap-3 break-inside-avoid">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 font-medium text-neutral-800">
          Reported: <strong>{count}d</strong>
        </span>
        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
          16+ Japa Target Met: <strong>{daysMet16}d</strong>
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 font-semibold ${
            daysBelow16 > 0
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800'
          }`}
        >
          Below 16 Rounds (&lt;16): <strong>{daysBelow16}d</strong>
        </span>
        <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 font-medium text-neutral-800">
          Avg Japa: <strong>{(totalRounds / count).toFixed(1)}</strong>
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-400">
        <table className="w-full border-collapse text-xs text-neutral-900">
          <thead>
            <tr className="bg-amber-50/90 text-amber-950">
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                Report Day
              </th>
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                &lt; 4:30 AM
              </th>
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                4:30–7 AM
              </th>
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                Total Japa
              </th>
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                Japa Status
              </th>
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                Book Study
              </th>
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                Shravanam
              </th>
              <th className="border border-neutral-300 px-2 py-1.5 text-center font-bold">
                Wake / Sleep
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isBelow16 = r.totalRounds < 16
              const roundsCellClass = isBelow16
                ? 'bg-red-50 text-red-700 font-bold'
                : 'bg-emerald-50 text-emerald-800 font-bold'
              const statusLabel = isBelow16 ? `Below 16 (${r.totalRounds}/16)` : '16+ Target Met'
              const wakeSleep =
                r.wakeTime || r.sleepTime
                  ? `${r.wakeTime ? formatTime12Hour(r.wakeTime) : '—'} / ${r.sleepTime ? formatTime12Hour(r.sleepTime) : '—'}`
                  : '—'
              return (
                <tr key={`summary-${r.id}`} className="bg-white">
                  <td className="border border-neutral-300 px-2 py-1.5 text-center font-medium">
                    {r.reportDate}
                  </td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-center">
                    {r.roundsBefore430}
                  </td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-center">
                    {r.roundsTill7am}
                  </td>
                  <td className={`border border-neutral-300 px-2 py-1.5 text-center ${roundsCellClass}`}>
                    {r.totalRounds}
                  </td>
                  <td className={`border border-neutral-300 px-2 py-1.5 text-center ${roundsCellClass}`}>
                    {statusLabel}
                  </td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-center">
                    {r.readingMinutes}m
                  </td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-center">
                    {r.hearingMinutes}m
                  </td>
                  <td className="border border-neutral-300 px-2 py-1.5 text-center">
                    {wakeSleep}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-100 font-bold text-neutral-900">
              <td className="border border-neutral-300 px-2 py-1.5 text-center">Average / Day</td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center">
                {(totalBefore430 / count).toFixed(1)}
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center">
                {(totalTill7am / count).toFixed(1)}
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center">
                {(totalRounds / count).toFixed(1)}
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center">
                {daysMet16}/{count} Met 16+
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center">
                {Math.round(totalRead / count)}m
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center">
                {Math.round(totalHear / count)}m
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-center">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// break-inside-avoid keeps a single field-section (e.g. "Chanting") from
// splitting across a page boundary where it fits on one page; it is
// intentionally NOT applied to the whole multi-section report, so a
// report that genuinely doesn't fit can still flow onto the next page
// instead of being forced there wholesale and leaving a large blank gap
// (approved product decision, Phase 16 — "avoid huge blank areas").
export function ReportSections({ report }: { report: SadhanaReport }) {
  const isBelow16 = report.totalRounds < 16

  return (
    <>
      <h2 className="rounded border-l-4 border-amber-600 bg-neutral-50 px-2.5 py-1 text-base font-semibold text-neutral-900">
        Date: {formatIsoDateAsDdMmYyyy(report.reportDate)}
      </h2>
      {buildSadhanaReportExportSections(report).map((section) => (
        <section
          key={section.title}
          className="mt-3 overflow-hidden rounded-md border border-neutral-300 break-inside-avoid"
        >
          <h3 className="border-b border-neutral-300 bg-neutral-100 px-3 py-1 text-xs font-semibold tracking-wide text-neutral-600 uppercase">
            {section.title}
          </h3>
          <dl className="divide-y divide-neutral-200">
            {section.fields.map((field, index) => {
              if (!field.label) {
                return (
                  <p key={index} className="px-3 py-1.5 text-sm whitespace-pre-wrap">
                    {field.value}
                  </p>
                )
              }
              const isTotalRoundsField = field.label === 'Total rounds chanted'
              const valueHighlightClass = isTotalRoundsField
                ? isBelow16
                  ? 'rounded border border-red-300 bg-red-50 px-2 py-0.5 font-bold text-red-700'
                  : 'rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800'
                : 'font-medium'

              return (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-4 px-3 py-1.5 text-sm"
                >
                  <dt className="text-neutral-700">{field.label}</dt>
                  <dd className={valueHighlightClass}>{field.value}</dd>
                </div>
              )
            })}
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
export function SadhanaExportPrintView(props: SadhanaExportPrintViewProps) {
  return (
    <div className="sadhana-print-view hidden font-serif text-black print:block">
      {props.mode === 'single' ? (
        <>
          <div className="border-b-2 border-amber-600 pb-2">
            <h1 className="text-xl font-bold text-amber-900">Sadhana Report</h1>
            {props.devoteeName ? (
              <p className="mt-1 text-sm font-semibold">Devotee: {props.devoteeName}</p>
            ) : null}
          </div>
          <div className="mt-4 break-inside-avoid">
            <ReportSections report={props.report} />
          </div>
        </>
      ) : (
        <>
          <div className="border-b-2 border-amber-600 pb-2">
            <h1 className="text-xl font-bold text-amber-900">Sadhana Reports</h1>
            {props.devoteeName ? (
              <p className="mt-1 text-sm font-semibold">Devotee: {props.devoteeName}</p>
            ) : null}
            <p className="mt-1 text-sm">
              Date Range: {formatIsoDateAsDdMmYyyy(props.fromDate)} to{' '}
              {formatIsoDateAsDdMmYyyy(props.toDate)}
            </p>
          </div>

          {props.reports.length === 0 ? (
            <p className="mt-6 text-sm">{NO_REPORTS_MESSAGE}</p>
          ) : (
            <>
              <SadhanaSummarySheetTable reports={props.reports} />
              <div className="mt-6 flex flex-col divide-y divide-neutral-300">
                {[...props.reports]
                  .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
                  .map((report) => (
                    <div key={report.id} className="break-inside-avoid py-6 first:pt-0">
                      <ReportSections report={report} />
                    </div>
                  ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

