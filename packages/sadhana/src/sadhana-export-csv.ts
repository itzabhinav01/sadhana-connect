import type { SadhanaReport } from '@sadhana-connect/domain'
import { formatTime12Hour } from '@sadhana-connect/shared'

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const CSV_HEADER = [
  'Date',
  'Chanting',
  'Reading(MIN)',
  'Wake Up Time',
  'Day Rest(MIN)',
  'Hearing(MIN)',
  'Reading Srila Prabhupada Book',
  'Chanting Completion Time',
  'Rounds Before 4:30 AM',
  'Rounds Till 7 AM',
  'Book Name',
  'Speaker Name',
  'Sleep Time',
  'Total Rest(HR)',
  'Office Going',
  'Office Return',
  'Notes',
  'Signature',
  'Chanting Status',
]

function csvField(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatCsvDate(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  const [year, monthStr, dayStr] = parts
  const monthIndex = Number(monthStr) - 1
  const monthName = MONTH_SHORT[monthIndex] ?? monthStr
  return `${dayStr.padStart(2, '0')} ${monthName} ${year}`
}

function formatPositiveOrDash(value: number): number | string {
  return value > 0 ? value : '-'
}

function formatTimeOrDash(value: string | null): string {
  if (!value) return '-'
  const formatted = formatTime12Hour(value)
  return formatted || '-'
}

function formatChantingStatus(totalRounds: number): string {
  if (totalRounds >= 16) return '16+ Rounds (Target Met)'
  if (totalRounds > 0) return `Below 16 (${totalRounds}/16)`
  return 'Below 16 (0/16)'
}

export function averagePositiveNumbers(values: number[]): number | string {
  const positive = values.filter((v) => v > 0)
  if (positive.length === 0) return '-'
  const sum = positive.reduce((acc, v) => acc + v, 0)
  const avg = sum / positive.length
  return Math.round(avg * 10) / 10
}

export function averageTimes(times: (string | null)[]): string {
  const validMinutes: number[] = []
  for (const time of times) {
    if (!time) continue
    const match = /^(\d{1,2}):(\d{2})/.exec(time.trim())
    if (!match) continue
    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (Number.isInteger(hours) && Number.isInteger(minutes)) {
      validMinutes.push(hours * 60 + minutes)
    }
  }
  if (validMinutes.length === 0) return '-'
  const avgTotalMinutes = Math.round(
    validMinutes.reduce((acc, m) => acc + m, 0) / validMinutes.length,
  )
  const normalized = ((avgTotalMinutes % 1440) + 1440) % 1440
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0')
  const mm = String(normalized % 60).padStart(2, '0')
  return formatTime12Hour(`${hh}:${mm}`)
}

function reportToRow(report: SadhanaReport): string {
  return [
    formatCsvDate(report.reportDate),
    formatPositiveOrDash(report.totalRounds),
    formatPositiveOrDash(report.readingMinutes),
    formatTimeOrDash(report.wakeTime),
    formatPositiveOrDash(report.dayRestMinutes),
    formatPositiveOrDash(report.hearingMinutes),
    formatPositiveOrDash(report.readingMinutes),
    formatTimeOrDash(report.lastRoundTime),
    formatPositiveOrDash(report.roundsBefore430),
    formatPositiveOrDash(report.roundsTill7am),
    report.bookName ?? '',
    report.speakerName ?? '',
    formatTimeOrDash(report.sleepTime),
    formatPositiveOrDash(report.totalRestMinutes),
    formatTimeOrDash(report.officeGoingTime),
    formatTimeOrDash(report.officeReturnTime),
    report.notes ?? '',
    report.signatureText ?? '',
    formatChantingStatus(report.totalRounds),
  ]
    .map(csvField)
    .join(',')
}

export interface SadhanaCsvOptions {
  devoteeName?: string
  groupName?: string
  subgroupName?: string
}

export function buildSadhanaHistoryCsv(
  reports: SadhanaReport[],
  options?: SadhanaCsvOptions | string,
): string {
  const sorted = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))
  const resolvedOptions: SadhanaCsvOptions =
    typeof options === 'string' ? { devoteeName: options } : (options ?? {})

  const fallbackName =
    sorted.find((r) => r.signatureText && r.signatureText.trim() !== '')?.signatureText?.trim() ??
    'Personal Sadhana'
  const headerName = resolvedOptions.devoteeName?.trim() || fallbackName
  const groupName = resolvedOptions.groupName?.trim() || 'Personal Sadhana'
  const subgroupName = resolvedOptions.subgroupName?.trim() || 'My Sadhana'
  const daysBelow16 = sorted.filter((r) => r.totalRounds < 16).length
  const days16Plus = sorted.filter((r) => r.totalRounds >= 16).length

  const metadataRows = [
    [headerName].map(csvField).join(','),
    ['Group', groupName].map(csvField).join(','),
    ['Subgroup', subgroupName].map(csvField).join(','),
    ['Days Reported', sorted.length].map(csvField).join(','),
    '',
  ]

  const tableRows = [CSV_HEADER.map(csvField).join(','), ...sorted.map(reportToRow)]

  const averagesRows = [
    '',
    'Activity averages',
    ['Activity', 'Average'].map(csvField).join(','),
    ['Chanting', averagePositiveNumbers(sorted.map((r) => r.totalRounds))].map(csvField).join(','),
    ['Reading(MIN)', averagePositiveNumbers(sorted.map((r) => r.readingMinutes))]
      .map(csvField)
      .join(','),
    ['Wake Up Time', averageTimes(sorted.map((r) => r.wakeTime))].map(csvField).join(','),
    ['Day Rest(MIN)', averagePositiveNumbers(sorted.map((r) => r.dayRestMinutes))]
      .map(csvField)
      .join(','),
    ['Hearing(MIN)', averagePositiveNumbers(sorted.map((r) => r.hearingMinutes))]
      .map(csvField)
      .join(','),
    [
      'Reading Srila Prabhupada Book',
      averagePositiveNumbers(sorted.map((r) => r.readingMinutes)),
    ]
      .map(csvField)
      .join(','),
    ['Chanting Completion Time', averageTimes(sorted.map((r) => r.lastRoundTime))]
      .map(csvField)
      .join(','),
    ['Days with 16+ Rounds', days16Plus].map(csvField).join(','),
    ['Days Below 16 Rounds (<16)', daysBelow16].map(csvField).join(','),
  ]

  return [...metadataRows, ...tableRows, ...averagesRows].join('\r\n')
}

// Builds a styled Excel/Spreadsheet HTML document (.xls) with crisp cell
// borders and automatic color highlighting (red/amber when Chanting < 16
// rounds, soft green when Chanting >= 16 rounds).
export function buildSadhanaHistorySpreadsheetHtml(
  reports: SadhanaReport[],
  options?: SadhanaCsvOptions | string,
): string {
  const sorted = [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate))
  const resolvedOptions: SadhanaCsvOptions =
    typeof options === 'string' ? { devoteeName: options } : (options ?? {})

  const fallbackName =
    sorted.find((r) => r.signatureText && r.signatureText.trim() !== '')?.signatureText?.trim() ??
    'Personal Sadhana'
  const headerName = resolvedOptions.devoteeName?.trim() || fallbackName
  const groupName = resolvedOptions.groupName?.trim() || 'Personal Sadhana'
  const subgroupName = resolvedOptions.subgroupName?.trim() || 'My Sadhana'
  const daysBelow16 = sorted.filter((r) => r.totalRounds < 16).length
  const days16Plus = sorted.filter((r) => r.totalRounds >= 16).length

  const cellStyle =
    'border:1px solid #cbd5e1;padding:6px 10px;font-family:Calibri,Arial,sans-serif;font-size:11pt;'
  const headerCellStyle =
    'border:1px solid #9a3412;padding:8px 10px;background-color:#ea580c;color:#ffffff;font-weight:bold;font-family:Calibri,Arial,sans-serif;font-size:11pt;text-align:center;'

  const rowsHtml = sorted
    .map((report, idx) => {
      const isBelow16 = report.totalRounds < 16
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
      const chantingCellStyle = isBelow16
        ? 'border:1px solid #f87171;padding:6px 10px;background-color:#fef2f2;color:#dc2626;font-weight:bold;text-align:center;font-family:Calibri,Arial,sans-serif;font-size:11pt;'
        : 'border:1px solid #86efac;padding:6px 10px;background-color:#f0fdf4;color:#15803d;font-weight:bold;text-align:center;font-family:Calibri,Arial,sans-serif;font-size:11pt;'

      return `<tr style="background-color:${rowBg};">
        <td style="${cellStyle}font-weight:600;">${escapeHtml(formatCsvDate(report.reportDate))}</td>
        <td style="${chantingCellStyle}">${escapeHtml(formatPositiveOrDash(report.totalRounds))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.readingMinutes))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatTimeOrDash(report.wakeTime))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.dayRestMinutes))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.hearingMinutes))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.readingMinutes))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatTimeOrDash(report.lastRoundTime))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.roundsBefore430))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.roundsTill7am))}</td>
        <td style="${cellStyle}">${escapeHtml(report.bookName ?? '')}</td>
        <td style="${cellStyle}">${escapeHtml(report.speakerName ?? '')}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatTimeOrDash(report.sleepTime))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.totalRestMinutes))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatTimeOrDash(report.officeGoingTime))}</td>
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatTimeOrDash(report.officeReturnTime))}</td>
        <td style="${cellStyle}">${escapeHtml(report.notes ?? '')}</td>
        <td style="${cellStyle}">${escapeHtml(report.signatureText ?? '')}</td>
        <td style="${chantingCellStyle}">${escapeHtml(formatChantingStatus(report.totalRounds))}</td>
      </tr>`
    })
    .join('')

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
</head>
<body>
  <table border="1" style="border-collapse:collapse;margin-bottom:16px;">
    <tr>
      <td colspan="2" style="border:1px solid #9a3412;padding:8px 12px;background-color:#fff7ed;color:#9a3412;font-weight:bold;font-size:14pt;font-family:Calibri,Arial,sans-serif;">
        ${escapeHtml(headerName)} — Sadhana Sheet
      </td>
    </tr>
    <tr>
      <td style="${cellStyle}font-weight:bold;background-color:#f8fafc;">Group</td>
      <td style="${cellStyle}">${escapeHtml(groupName)}</td>
    </tr>
    <tr>
      <td style="${cellStyle}font-weight:bold;background-color:#f8fafc;">Subgroup</td>
      <td style="${cellStyle}">${escapeHtml(subgroupName)}</td>
    </tr>
    <tr>
      <td style="${cellStyle}font-weight:bold;background-color:#f8fafc;">Days Reported</td>
      <td style="${cellStyle}font-weight:bold;">${sorted.length}</td>
    </tr>
    <tr>
      <td style="${cellStyle}font-weight:bold;background-color:#f0fdf4;color:#15803d;">Days 16+ Rounds</td>
      <td style="${cellStyle}font-weight:bold;background-color:#f0fdf4;color:#15803d;">${days16Plus}</td>
    </tr>
    <tr>
      <td style="${cellStyle}font-weight:bold;background-color:#fef2f2;color:#dc2626;">Days Below 16 Rounds (&lt;16)</td>
      <td style="${cellStyle}font-weight:bold;background-color:#fef2f2;color:#dc2626;">${daysBelow16}</td>
    </tr>
  </table>

  <table border="1" style="border-collapse:collapse;margin-bottom:20px;">
    <thead>
      <tr>
        ${CSV_HEADER.map((col) => `<th style="${headerCellStyle}">${escapeHtml(col)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <table border="1" style="border-collapse:collapse;">
    <thead>
      <tr>
        <th colspan="2" style="${headerCellStyle}">Activity Averages</th>
      </tr>
      <tr>
        <th style="${cellStyle}font-weight:bold;background-color:#ffedd5;color:#9a3412;">Activity</th>
        <th style="${cellStyle}font-weight:bold;background-color:#ffedd5;color:#9a3412;">Average</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="${cellStyle}font-weight:600;">Chanting</td>
        <td style="${cellStyle}font-weight:bold;">${escapeHtml(averagePositiveNumbers(sorted.map((r) => r.totalRounds)))}</td>
      </tr>
      <tr>
        <td style="${cellStyle}font-weight:600;">Reading(MIN)</td>
        <td style="${cellStyle}">${escapeHtml(averagePositiveNumbers(sorted.map((r) => r.readingMinutes)))}</td>
      </tr>
      <tr>
        <td style="${cellStyle}font-weight:600;">Wake Up Time</td>
        <td style="${cellStyle}">${escapeHtml(averageTimes(sorted.map((r) => r.wakeTime)))}</td>
      </tr>
      <tr>
        <td style="${cellStyle}font-weight:600;">Day Rest(MIN)</td>
        <td style="${cellStyle}">${escapeHtml(averagePositiveNumbers(sorted.map((r) => r.dayRestMinutes)))}</td>
      </tr>
      <tr>
        <td style="${cellStyle}font-weight:600;">Hearing(MIN)</td>
        <td style="${cellStyle}">${escapeHtml(averagePositiveNumbers(sorted.map((r) => r.hearingMinutes)))}</td>
      </tr>
      <tr>
        <td style="${cellStyle}font-weight:600;">Reading Srila Prabhupada Book</td>
        <td style="${cellStyle}">${escapeHtml(averagePositiveNumbers(sorted.map((r) => r.readingMinutes)))}</td>
      </tr>
      <tr>
        <td style="${cellStyle}font-weight:600;">Chanting Completion Time</td>
        <td style="${cellStyle}">${escapeHtml(averageTimes(sorted.map((r) => r.lastRoundTime)))}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`
}

