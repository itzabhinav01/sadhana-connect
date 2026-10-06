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
  groupNames?: string[]
  reports: SadhanaReport[]
}

export interface BuildSadhanaAiPromptParams {
  fromDate: string
  toDate: string
  selectedGroupName?: string
  people?: SadhanaAiPersonData[]
  devotees?: SadhanaAiPersonData[]
}

function parseTimeToMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null
  const match = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function averageTimeFormatted(
  times: (string | null | undefined)[],
  wrapEveningAroundMidnight = false,
): string {
  const validMinutes: number[] = []
  for (const t of times) {
    const mins = parseTimeToMinutes(t)
    if (mins !== null) {
      // For sleep time, 21:00 (1260) and 00:30 (30) should average around 22:45, not 10:45 AM
      const adjusted = wrapEveningAroundMidnight && mins < 12 * 60 ? mins + 24 * 60 : mins
      validMinutes.push(adjusted)
    }
  }
  if (validMinutes.length === 0) return '-'
  const avg = Math.round(
    validMinutes.reduce((acc, v) => acc + v, 0) / validMinutes.length,
  )
  const normalized = ((avg % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return formatTime12Hour(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
}

function computeTrailingStreak(
  allDates: string[],
  reportByDate: Map<string, SadhanaReport>,
): number {
  if (allDates.length === 0) return reportByDate.size
  let streak = 0
  for (let i = allDates.length - 1; i >= 0; i--) {
    if (reportByDate.has(allDates[i])) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function buildPersonPrecomputedStats(
  reports: SadhanaReport[],
  allDates: string[],
  reportByDate: Map<string, SadhanaReport>,
): string {
  const totalDays = allDates.length > 0 ? allDates.length : reports.length
  const reportedCount =
    allDates.length > 0
      ? allDates.filter((date) => reportByDate.has(date)).length
      : reports.length
  const completionPct = totalDays > 0 ? Math.round((reportedCount / totalDays) * 100) : 0
  const trailingStreak = computeTrailingStreak(allDates, reportByDate)

  if (reports.length === 0) {
    return [
      `Pre-Calculated Summary:`,
      `  • Reporting: 0/${totalDays} days (0%) | End-of-Range Reporting Streak: 0 days`,
      `  • Activity: No reports submitted in this window (Not reported ≠ Sadhana not performed).`,
    ].join('\n')
  }

  const count = reports.length
  const totalRounds = reports.reduce((sum, r) => sum + r.totalRounds, 0)
  const before430Total = reports.reduce((sum, r) => sum + r.roundsBefore430, 0)
  const till7amTotal = reports.reduce((sum, r) => sum + r.roundsTill7am, 0)
  const morningRoundsTotal = before430Total + till7amTotal
  const avgRounds = (totalRounds / count).toFixed(1)
  const before430Pct = totalRounds > 0 ? Math.round((before430Total / totalRounds) * 100) : 0
  const before7amPct =
    totalRounds > 0 ? Math.round((morningRoundsTotal / totalRounds) * 100) : 0
  const avgLastRoundTime = averageTimeFormatted(reports.map((r) => r.lastRoundTime))

  const totalReading = reports.reduce((sum, r) => sum + r.readingMinutes, 0)
  const avgReading = Math.round(totalReading / count)
  const readingDays = reports.filter((r) => r.readingMinutes > 0).length
  const books = [
    ...new Set(reports.map((r) => r.bookName?.trim()).filter((b): b is string => Boolean(b))),
  ]

  const totalHearing = reports.reduce((sum, r) => sum + r.hearingMinutes, 0)
  const avgHearing = Math.round(totalHearing / count)
  const hearingDays = reports.filter((r) => r.hearingMinutes > 0).length
  const speakers = [
    ...new Set(
      reports.map((r) => r.speakerName?.trim()).filter((s): s is string => Boolean(s)),
    ),
  ]

  const totalStudy = reports.reduce((sum, r) => sum + (r.studyHours ?? 0), 0)
  const avgStudy = (totalStudy / count).toFixed(1)
  const studyDays = reports.filter((r) => (r.studyHours ?? 0) > 0).length

  const avgWake = averageTimeFormatted(reports.map((r) => r.wakeTime))
  const avgSleep = averageTimeFormatted(reports.map((r) => r.sleepTime), true)
  const avgDayRest = Math.round(
    reports.reduce((sum, r) => sum + r.dayRestMinutes, 0) / count,
  )
  const avgTotalRest = (
    reports.reduce((sum, r) => sum + r.totalRestMinutes, 0) / count
  ).toFixed(1)

  return [
    `Pre-Calculated Summary (use these exact figures; do not recalculate):`,
    `  • Reporting: ${reportedCount}/${totalDays} days (${completionPct}%) | End-of-Range Streak: ${trailingStreak} day(s)`,
    `  • Chanting: Total ${totalRounds} rounds | Avg ${avgRounds} rounds/reported day | Before 4:30 AM: ${before430Total} rounds (${before430Pct}%) | 4:30–7:00 AM: ${till7amTotal} rounds | Total Morning (<7 AM): ${morningRoundsTotal}/${totalRounds} (${before7amPct}%) | Avg Completion Time: ${avgLastRoundTime}`,
    `  • Reading: Total ${totalReading} min | Avg ${avgReading} min/reported day (${readingDays}/${count} reported days)${books.length > 0 ? ` | Books: ${books.join(', ')}` : ''}`,
    `  • Hearing: Total ${totalHearing} min | Avg ${avgHearing} min/reported day (${hearingDays}/${count} reported days)${speakers.length > 0 ? ` | Speakers: ${speakers.join(', ')}` : ''}`,
    ...(totalStudy > 0
      ? [
          `  • Study: Total ${Math.round(totalStudy * 10) / 10} hr | Avg ${avgStudy} hr/reported day (${studyDays}/${count} reported days)`,
        ]
      : []),
    `  • Rest & Schedule: Avg Wake: ${avgWake} | Avg Sleep: ${avgSleep} | Avg Day Rest: ${avgDayRest} min | Avg Total Rest: ${avgTotalRest} hr`,
  ].join('\n')
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

  if ((report.studyHours ?? 0) > 0) {
    parts.push(`Study: ${report.studyHours} hr`)
  }

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
  selectedGroupName,
  people,
  devotees,
}: BuildSadhanaAiPromptParams): string {
  const allDates = buildDateRangeList(fromDate, toDate)
  const items = people ?? devotees ?? []
  const isMentorMode = items.length > 1 || Boolean(selectedGroupName)

  const modeInstructions = isMentorMode
    ? [
        '   OUTPUT STRUCTURE FOR MENTOR MODE (follow these 4 sections clearly):',
        '1. **Group Health Snapshot**: Summarize overall reporting rate, collective morning japa discipline (% rounds before 7 AM), reading/hearing consistency, and common sleep/wake patterns across the group (and compare sub-groups if multiple group tags exist).',
        '2. **Categorized Devotees**: Group every devotee into:',
        '   - 🟢 **Consistent / Thriving** (steady reporting, strong morning japa & study)',
        '   - 📈 **Improving / Building Momentum** (positive effort or recovery)',
        '   - 🟡 **Slipping / Needs Gentle Care** (late sleep/wake, rounds shifting to late evening, or low study)',
        '   - 🔴 **Unreported / Follow-Up Needed** (missing logs — remember: missing log = not reported, NOT Sadhana not performed)',
        '3. **Specific Care Actions & Appreciation Points per Devotee**: For each devotee, give 1 specific appreciation point + 1 concrete, practical coaching point or question for the mentor’s personal check-in.',
        '4. **Ready-to-Send WhatsApp Follow-Up Message Drafts**:',
        '   - **Group WhatsApp Message**: 1 warm, encouraging summary message for the youth group chat.',
        '   - **1-on-1 Follow-Up Drafts**: Short, caring personal WhatsApp messages for devotees who need appreciation or a gentle check-in.',
      ].join('\n')
    : [
        '   OUTPUT STRUCTURE FOR INDIVIDUAL MODE (follow these 4 sections clearly):',
        '1. **Warm Encouraging Assessment**: Acknowledge reporting honesty, consistency, and specific strengths during this period with an uplifting, Vaisnava-friendly tone.',
        '2. **Japa Timing & Sleep–Wake Correlation Analysis**: Analyze how sleep time, wake-up time, day rest, and work/office schedule are influencing rounds chanted before 4:30 AM / 7:00 AM and japa completion time.',
        '3. **Study (Reading & Hearing) Consistency**: Evaluate daily reading and hearing rhythm, books/speakers engaged with, and how to make study steadier even on busy days.',
        '4. **Practical 3-Point Action Plan for Tomorrow / Next Week**: Provide 3 small, realistic, high-impact adjustments (e.g., shifting sleep time by 15–20 min, anchoring reading to a fixed daily slot) that are easy to apply immediately.',
      ].join('\n')

  const header = [
    `Analyze the following Sadhna performance data. If there is ONE person, use INDIVIDUAL MODE; if MULTIPLE people, use MENTOR MODE. Do not repeat the raw data. For ${fromDate} to ${toDate}`,
    ...(selectedGroupName ? [`Selected Youth Group Filter: ${selectedGroupName}`] : []),
    '   RULES',
    '- Analyze any date range, including 1–2 days. For short periods describe observations, not long-term trends.',
    '- Distinguish a short selected range from sparse reporting within a longer range.',
    '- Missing/"No Logged Activity" = not reported, NOT Sadhna not performed.',
    '- Marks are app scores, not spiritual advancement. Use actual activity values, consistency and reporting for conclusions.',
    '- Use the Pre-Calculated Summary figures provided for each person rather than guessing averages.',
    '- Flag suspicious values as data-quality issues rather than interpreting them.',
    '- If evidence is inadequate, say "Insufficient data".',
    '- Be concise, encouraging, practical and non-judgmental.',
    '',
    modeInstructions,
  ].join('\n')

  const personBlocks = items.map((person, index) => {
    const personName = person.name || person.devoteeName || 'Devotee'
    const groupSuffix =
      person.groupNames && person.groupNames.length > 0
        ? ` [Groups: ${person.groupNames.join(', ')}]`
        : ''
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
    const precomputedStats = buildPersonPrecomputedStats(
      person.reports,
      allDates,
      reportByDate,
    )

    return [
      `=== Person ${index + 1}: ${personName} (Days Reported: ${reportedCount}/${totalDays})${groupSuffix} ===`,
      precomputedStats,
      'Daily Logs:',
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
