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
  'Study(HR)',
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
    formatPositiveOrDash(report.studyHours ?? 0),
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
    ['Study(HR)', averagePositiveNumbers(sorted.map((r) => r.studyHours ?? 0))]
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
        <td style="${cellStyle}text-align:center;">${escapeHtml(formatPositiveOrDash(report.studyHours ?? 0))}</td>
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

// ============================================================================
// Genuine OpenXML (.xlsx) Workbook Generator (Zero External Dependencies)
// ============================================================================
// Produces a spec-compliant .xlsx ZIP archive using STORE (method 0) so that
// Microsoft Excel (Windows, macOS, Android, iOS), Google Sheets, Apple Numbers,
// and WPS Office open the file with zero corruption or extension warnings,
// while preserving full cell borders and red (<16) / green (16+) cell fills.

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function encodeUtf8(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str)
  }
  const utf8: number[] = []
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i)
    if (charCode < 0x80) {
      utf8.push(charCode)
    } else if (charCode < 0x800) {
      utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f))
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8.push(
        0xe0 | (charCode >> 12),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      )
    } else {
      i++
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
      utf8.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      )
    }
  }
  return new Uint8Array(utf8)
}

function writeUint16LE(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff
  buf[offset + 1] = (value >>> 8) & 0xff
}

function writeUint32LE(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff
  buf[offset + 1] = (value >>> 8) & 0xff
  buf[offset + 2] = (value >>> 16) & 0xff
  buf[offset + 3] = (value >>> 24) & 0xff
}

function buildStoreZip(files: { name: string; content: string }[]): Uint8Array {
  const entries = files.map((file) => {
    const nameBytes = encodeUtf8(file.name)
    const dataBytes = encodeUtf8(file.content)
    const crc = crc32(dataBytes)
    return { nameBytes, dataBytes, crc }
  })

  let localTotalSize = 0
  let centralTotalSize = 0
  for (const entry of entries) {
    localTotalSize += 30 + entry.nameBytes.length + entry.dataBytes.length
    centralTotalSize += 46 + entry.nameBytes.length
  }

  const totalSize = localTotalSize + centralTotalSize + 22
  const out = new Uint8Array(totalSize)

  let localOffset = 0
  const localOffsets: number[] = []

  for (const entry of entries) {
    localOffsets.push(localOffset)
    // Local file header signature
    writeUint32LE(out, localOffset, 0x04034b50)
    // Version needed to extract (2.0)
    writeUint16LE(out, localOffset + 4, 20)
    // General purpose bit flag (UTF-8)
    writeUint16LE(out, localOffset + 6, 0x0800)
    // Compression method (0 = STORE)
    writeUint16LE(out, localOffset + 8, 0)
    // Last mod file time & date (1980-01-01 00:00)
    writeUint16LE(out, localOffset + 10, 0)
    writeUint16LE(out, localOffset + 12, 0x0021)
    // CRC-32
    writeUint32LE(out, localOffset + 14, entry.crc)
    // Compressed & uncompressed size
    writeUint32LE(out, localOffset + 18, entry.dataBytes.length)
    writeUint32LE(out, localOffset + 22, entry.dataBytes.length)
    // File name length & extra field length
    writeUint16LE(out, localOffset + 26, entry.nameBytes.length)
    writeUint16LE(out, localOffset + 28, 0)
    out.set(entry.nameBytes, localOffset + 30)
    out.set(entry.dataBytes, localOffset + 30 + entry.nameBytes.length)
    localOffset += 30 + entry.nameBytes.length + entry.dataBytes.length
  }

  let centralOffset = localOffset
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    writeUint32LE(out, centralOffset, 0x02014b50)
    writeUint16LE(out, centralOffset + 4, 20)
    writeUint16LE(out, centralOffset + 6, 20)
    writeUint16LE(out, centralOffset + 8, 0x0800)
    writeUint16LE(out, centralOffset + 10, 0)
    writeUint16LE(out, centralOffset + 12, 0)
    writeUint16LE(out, centralOffset + 14, 0x0021)
    writeUint32LE(out, centralOffset + 16, entry.crc)
    writeUint32LE(out, centralOffset + 20, entry.dataBytes.length)
    writeUint32LE(out, centralOffset + 24, entry.dataBytes.length)
    writeUint16LE(out, centralOffset + 28, entry.nameBytes.length)
    writeUint16LE(out, centralOffset + 30, 0)
    writeUint16LE(out, centralOffset + 32, 0)
    writeUint16LE(out, centralOffset + 34, 0)
    writeUint16LE(out, centralOffset + 36, 0)
    writeUint32LE(out, centralOffset + 38, 0)
    writeUint32LE(out, centralOffset + 42, localOffsets[i])
    out.set(entry.nameBytes, centralOffset + 46)
    centralOffset += 46 + entry.nameBytes.length
  }

  // End of central directory record
  writeUint32LE(out, centralOffset, 0x06054b50)
  writeUint16LE(out, centralOffset + 4, 0)
  writeUint16LE(out, centralOffset + 6, 0)
  writeUint16LE(out, centralOffset + 8, entries.length)
  writeUint16LE(out, centralOffset + 10, entries.length)
  writeUint32LE(out, centralOffset + 12, centralTotalSize)
  writeUint32LE(out, centralOffset + 16, localTotalSize)
  writeUint16LE(out, centralOffset + 20, 0)

  return out
}

function escapeXml(value: number | string): string {
  // Strip invalid XML 1.0 control characters and escape XML entities
  const cleaned = String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  return escapeHtml(cleaned)
}

function excelColName(colIndexZeroBased: number): string {
  let n = colIndexZeroBased + 1
  let name = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

interface XlsxCell {
  value: number | string
  style: number
}

function buildSheetRowXml(rowNumber1Based: number, cells: XlsxCell[]): string {
  const cellsXml = cells
    .map((cell, colIdx) => {
      const ref = `${excelColName(colIdx)}${rowNumber1Based}`
      if (typeof cell.value === 'number' && Number.isFinite(cell.value)) {
        return `<c r="${ref}" s="${cell.style}" t="n"><v>${cell.value}</v></c>`
      }
      return `<c r="${ref}" s="${cell.style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`
    })
    .join('')
  return `<row r="${rowNumber1Based}">${cellsXml}</row>`
}

const XLSX_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="6">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FF9A3412"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFDC2626"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF15803D"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEA580C"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="thin"><color rgb="FF94A3B8"/></top>
      <bottom style="thin"><color rgb="FF94A3B8"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`

export function buildSadhanaHistoryXlsxBytes(
  reports: SadhanaReport[],
  options?: SadhanaCsvOptions | string,
): Uint8Array {
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

  // Styles in XLSX_STYLES_XML:
  // 1: Title Banner (Saffron bold, cream fill, bordered)
  // 2: Table Column Header (White bold, Saffron fill, bordered, centered)
  // 3: Regular Centered Cell (bordered)
  // 4: Regular Left-Aligned Cell (bordered)
  // 5: Below 16 Rounds (<16) Alert Cell (Red bold, soft red fill, bordered)
  // 6: 16+ Rounds (>=16) Target Met Cell (Green bold, soft green fill, bordered)
  // 7: Summary Label Cell (Bold, light slate fill, bordered, left)
  // 8: Summary Value Cell (Bold, light slate fill, bordered, centered)

  const xmlRows: string[] = []
  let rowNum = 1

  // Top Summary Block
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: `${headerName} — Sadhana Sheet`, style: 1 },
      { value: '', style: 1 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Group', style: 7 },
      { value: groupName, style: 4 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Subgroup', style: 7 },
      { value: subgroupName, style: 4 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Days Reported', style: 7 },
      { value: sorted.length, style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Days with 16+ Rounds', style: 6 },
      { value: days16Plus, style: 6 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Days Below 16 Rounds (<16)', style: 5 },
      { value: daysBelow16, style: 5 },
    ]),
  )

  // Blank separator row
  rowNum++

  // Daily Table Header Row
  xmlRows.push(
    buildSheetRowXml(
      rowNum++,
      CSV_HEADER.map((col) => ({ value: col, style: 2 })),
    ),
  )

  // Daily Report Rows
  for (const report of sorted) {
    const isBelow16 = report.totalRounds < 16
    const chantingStyle = isBelow16 ? 5 : 6
    xmlRows.push(
      buildSheetRowXml(rowNum++, [
        { value: formatCsvDate(report.reportDate), style: 8 },
        { value: formatPositiveOrDash(report.totalRounds), style: chantingStyle },
        { value: formatPositiveOrDash(report.readingMinutes), style: 3 },
        { value: formatTimeOrDash(report.wakeTime), style: 3 },
        { value: formatPositiveOrDash(report.dayRestMinutes), style: 3 },
        { value: formatPositiveOrDash(report.hearingMinutes), style: 3 },
        { value: formatPositiveOrDash(report.readingMinutes), style: 3 },
        { value: formatTimeOrDash(report.lastRoundTime), style: 3 },
        { value: formatPositiveOrDash(report.roundsBefore430), style: 3 },
        { value: formatPositiveOrDash(report.roundsTill7am), style: 3 },
        { value: report.bookName ?? '', style: 4 },
        { value: report.speakerName ?? '', style: 4 },
        { value: formatPositiveOrDash(report.studyHours ?? 0), style: 3 },
        { value: formatTimeOrDash(report.sleepTime), style: 3 },
        { value: formatPositiveOrDash(report.totalRestMinutes), style: 3 },
        { value: formatTimeOrDash(report.officeGoingTime), style: 3 },
        { value: formatTimeOrDash(report.officeReturnTime), style: 3 },
        { value: report.notes ?? '', style: 4 },
        { value: report.signatureText ?? '', style: 4 },
        { value: formatChantingStatus(report.totalRounds), style: chantingStyle },
      ]),
    )
  }

  // Blank separator row
  rowNum++

  // Activity Averages Table
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Activity Averages', style: 2 },
      { value: 'Average', style: 2 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Chanting', style: 7 },
      { value: averagePositiveNumbers(sorted.map((r) => r.totalRounds)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Reading(MIN)', style: 7 },
      { value: averagePositiveNumbers(sorted.map((r) => r.readingMinutes)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Wake Up Time', style: 7 },
      { value: averageTimes(sorted.map((r) => r.wakeTime)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Day Rest(MIN)', style: 7 },
      { value: averagePositiveNumbers(sorted.map((r) => r.dayRestMinutes)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Hearing(MIN)', style: 7 },
      { value: averagePositiveNumbers(sorted.map((r) => r.hearingMinutes)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Study(HR)', style: 7 },
      { value: averagePositiveNumbers(sorted.map((r) => r.studyHours ?? 0)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Reading Srila Prabhupada Book', style: 7 },
      { value: averagePositiveNumbers(sorted.map((r) => r.readingMinutes)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Chanting Completion Time', style: 7 },
      { value: averageTimes(sorted.map((r) => r.lastRoundTime)), style: 8 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum++, [
      { value: 'Days with 16+ Rounds', style: 6 },
      { value: days16Plus, style: 6 },
    ]),
  )
  xmlRows.push(
    buildSheetRowXml(rowNum, [
      { value: 'Days Below 16 Rounds (<16)', style: 5 },
      { value: daysBelow16, style: 5 },
    ]),
  )

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="26" customWidth="1"/>
    <col min="2" max="10" width="18" customWidth="1"/>
    <col min="11" max="12" width="24" customWidth="1"/>
    <col min="13" max="16" width="16" customWidth="1"/>
    <col min="17" max="18" width="26" customWidth="1"/>
    <col min="19" max="19" width="24" customWidth="1"/>
  </cols>
  <sheetData>${xmlRows.join('')}</sheetData>
</worksheet>`

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sadhana Report" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  return buildStoreZip([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/styles.xml', content: XLSX_STYLES_XML },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml },
  ])
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function buildSadhanaHistoryXlsxBase64(
  reports: SadhanaReport[],
  options?: SadhanaCsvOptions | string,
): string {
  const bytes = buildSadhanaHistoryXlsxBytes(reports, options)
  let result = ''
  const len = bytes.length
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < len ? bytes[i + 1] : 0
    const b2 = i + 2 < len ? bytes[i + 2] : 0
    result += BASE64_CHARS[b0 >> 2]
    result += BASE64_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)]
    result += i + 1 < len ? BASE64_CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)] : '='
    result += i + 2 < len ? BASE64_CHARS[b2 & 0x3f] : '='
  }
  return result
}


