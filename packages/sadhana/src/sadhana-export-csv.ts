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
]

function csvField(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function formatCsvDate(isoDate: string): string {
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

function averagePositiveNumbers(values: number[]): number | string {
  const positive = values.filter((v) => v > 0)
  if (positive.length === 0) return '-'
  const sum = positive.reduce((acc, v) => acc + v, 0)
  const avg = sum / positive.length
  return Math.round(avg * 10) / 10
}

function averageTimes(times: (string | null)[]): string {
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
  ]

  return [...metadataRows, ...tableRows, ...averagesRows].join('\r\n')
}
