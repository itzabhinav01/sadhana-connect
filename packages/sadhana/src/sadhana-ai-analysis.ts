import type { SadhanaReport } from '@sadhana-connect/domain'
import { buildDateRangeList, formatTime12Hour } from '@sadhana-connect/shared'

export const AI_PROVIDERS = ['chatgpt', 'gemini', 'claude'] as const
export type AiProvider = (typeof AI_PROVIDERS)[number]

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  claude: 'Claude',
}

export interface SadhanaAiPersonData {
  name?: string
  devoteeName?: string
  reports: SadhanaReport[]
}

export interface BuildSadhanaAiPromptParams {
  fromDate: string
  toDate: string
  people?: SadhanaAiPersonData[]
  devotees?: SadhanaAiPersonData[]
}

function formatReportLine(date: string, report: SadhanaReport | undefined): string {
  if (!report) {
    return `${date}: No Logged Activity`
  }

  const parts: string[] = [
    `Chanting: ${report.totalRounds} rounds (Before 4:30 AM: ${report.roundsBefore430}, Till 7 AM: ${report.roundsTill7am}${
      report.lastRoundTime ? `, Completed: ${formatTime12Hour(report.lastRoundTime)}` : ''
    })`,
    `Reading: ${report.readingMinutes} min${report.bookName ? ` (${report.bookName})` : ''}`,
    `Hearing: ${report.hearingMinutes} min${report.speakerName ? ` (${report.speakerName})` : ''}`,
  ]

  if (report.wakeTime) {
    parts.push(`Wake Up: ${formatTime12Hour(report.wakeTime)}`)
  }
  if (report.sleepTime) {
    parts.push(`Sleep: ${formatTime12Hour(report.sleepTime)}`)
  }
  if (report.dayRestMinutes > 0) {
    parts.push(`Day Rest: ${report.dayRestMinutes} min`)
  }
  if (report.totalRestMinutes > 0) {
    parts.push(`Total Rest: ${report.totalRestMinutes} hr`)
  }
  if (report.officeGoingTime || report.officeReturnTime) {
    parts.push(
      `Office: ${report.officeGoingTime ? formatTime12Hour(report.officeGoingTime) : '-'} to ${
        report.officeReturnTime ? formatTime12Hour(report.officeReturnTime) : '-'
      }`,
    )
  }
  if (report.notes) {
    parts.push(`Notes: "${report.notes}"`)
  }

  return `${date}: ${parts.join(' | ')}`
}

export function buildSadhanaAiPrompt({
  fromDate,
  toDate,
  people,
  devotees,
}: BuildSadhanaAiPromptParams): string {
  const allDates = buildDateRangeList(fromDate, toDate)
  const items = people ?? devotees ?? []

  const header = [
    `Analyze the following Sadhna performance data. If there is ONE person, use INDIVIDUAL MODE; if MULTIPLE people, use MENTOR MODE. Do not repeat the raw data. For ${fromDate} to ${toDate}`,
    '   RULES',
    '- Analyze any date range, including 1–2 days. For short periods describe observations, not long-term trends.',
    '- Distinguish a short selected range from sparse reporting within a longer range.',
    '- Missing/"No Logged Activity" = not reported, NOT Sadhna not performed.',
    '- Marks are app scores, not spiritual advancement. Use actual activity values, consistency and reporting for conclusions.',
    '- Flag suspicious values as data-quality issues rather than interpreting them.',
    '- If evidence is inadequate, say "Insufficient data".',
    '- Be concise, encouraging, practical and non-judgmental.',
  ].join('\n')

  const personBlocks = items.map((person, index) => {
    const personName = person.name || person.devoteeName || 'Devotee'
    const reportByDate = new Map<string, SadhanaReport>()
    for (const report of person.reports) {
      reportByDate.set(report.reportDate, report)
    }

    const lines =
      allDates.length > 0
        ? allDates.map((date) => formatReportLine(date, reportByDate.get(date)))
        : [...person.reports]
            .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
            .map((report) => formatReportLine(report.reportDate, report))

    const reportedCount =
      allDates.length > 0
        ? allDates.filter((date) => reportByDate.has(date)).length
        : person.reports.length
    const totalDays = allDates.length > 0 ? allDates.length : person.reports.length

    return [
      `=== Person ${index + 1}: ${personName} (Days Reported: ${reportedCount}/${totalDays}) ===`,
      ...lines,
    ].join('\n')
  })

  return `${header}\n\nSADHANA LOGS (${fromDate} to ${toDate}):\n\n${personBlocks.join('\n\n')}`
}

// Keep URL query parameter below safe browser URL limits (~6000 chars);
// callers also copy the full prompt to the clipboard so if a multi-devotee
// 30-day prompt is very large or opened in Gemini, the user can paste it immediately.
const MAX_URL_PROMPT_CHARS = 6000

export function buildAiProviderUrl(provider: AiProvider, prompt: string): string {
  const safePrompt =
    prompt.length > MAX_URL_PROMPT_CHARS
      ? `${prompt.slice(0, MAX_URL_PROMPT_CHARS)}\n\n[Truncated in URL — full Sadhana logs copied to clipboard, paste if needed]`
      : prompt

  if (provider === 'chatgpt') {
    return `https://chatgpt.com/?q=${encodeURIComponent(safePrompt)}`
  }
  if (provider === 'claude') {
    return `https://claude.ai/new?q=${encodeURIComponent(safePrompt)}`
  }
  return `https://gemini.google.com/app`
}
