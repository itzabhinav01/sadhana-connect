import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { SadhanaReportComments } from '@/presentation/pages/sadhana/SadhanaReportComments'

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function formatTime(time: string | null) {
  if (!time) return null
  const [hourStr, minute] = time.split(':')
  const hour = Number(hourStr)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minute} ${period}`
}

interface SadhanaReportSummaryRowProps {
  report: SadhanaReport
  // 'compact' (dashboard's Recent Reports card): date + total rounds
  // only. 'detailed' (History): also reading/hearing minutes and
  // sleep/wake when present. Same link/navigation behavior either way —
  // only how much is shown per row differs.
  variant?: 'compact' | 'detailed'
}

export function SadhanaReportSummaryRow({
  report,
  variant = 'detailed',
}: SadhanaReportSummaryRowProps) {
  const [showComments, setShowComments] = useState(false)
  const sleepLabel = formatTime(report.sleepTime)
  const wakeLabel = formatTime(report.wakeTime)
  const dateLabel = formatDisplayDate(report.reportDate)

  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <Link
          to={`/sadhana?date=${report.reportDate}`}
          className="flex flex-1 items-center justify-between gap-4 rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-medium text-foreground">{dateLabel}</span>

          {variant === 'compact' ? (
            <span className="text-muted-foreground">
              {report.totalRounds} rounds
            </span>
          ) : (
            <span className="flex flex-col items-end gap-0.5 text-muted-foreground">
              <span>
                {report.totalRounds} rounds · {report.readingMinutes}m
                reading · {report.hearingMinutes}m hearing
              </span>
              {sleepLabel || wakeLabel ? (
                <span className="text-xs">
                  {sleepLabel ?? '—'} → {wakeLabel ?? '—'}
                </span>
              ) : null}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setShowComments((current) => !current)}
          aria-expanded={showComments}
          aria-label={`${showComments ? 'Hide' : 'Show'} mentor comments for ${dateLabel}`}
          className="shrink-0 rounded-sm px-2 py-1 text-xs text-muted-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {showComments ? 'Hide comments' : 'Comments'}
        </button>
      </div>
      {showComments ? (
        <SadhanaReportComments sadhanaReportId={report.id} />
      ) : null}
    </div>
  )
}
