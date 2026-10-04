import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  buildWhatsAppShareUrl,
  shouldPromptForWhatsAppRecipient,
} from '@sadhana-connect/sadhana'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
import { formatIsoDateLong } from '@sadhana-connect/shared'
import { WhatsAppShareModal } from '@/presentation/components/shared/WhatsAppShareModal'
import { SadhanaReportComments } from '@/presentation/pages/sadhana/SadhanaReportComments'

function formatDisplayDate(iso: string) {
  return formatIsoDateLong(iso)
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
  // Export actions (Phase 16) are opt-in via these callbacks rather than
  // always rendered — this same row component is also used by the
  // Dashboard's Recent Reports list, which must NOT show export controls
  // (approved product decision, Phase 16). Only HistoryReportList passes
  // these.
  onExportPdf?: (report: SadhanaReport) => void
  onExportText?: (report: SadhanaReport) => void
}

export function SadhanaReportSummaryRow({
  report,
  variant = 'detailed',
  onExportPdf,
  onExportText,
}: SadhanaReportSummaryRowProps) {
  const [showComments, setShowComments] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const sleepLabel = formatTime(report.sleepTime)
  const wakeLabel = formatTime(report.wakeTime)
  const dateLabel = formatDisplayDate(report.reportDate)

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-col gap-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link
          to={`/sadhana?date=${report.reportDate}`}
          className="flex min-w-0 flex-1 flex-col gap-1 rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <span className="font-semibold text-foreground">{dateLabel}</span>

          {variant === 'compact' ? (
            <span className="text-muted-foreground">
              {report.totalRounds} rounds
            </span>
          ) : (
            <span className="flex flex-col gap-0.5 text-muted-foreground sm:items-end">
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
        <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:gap-2">
          <a
            href={buildWhatsAppShareUrl(report)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (shouldPromptForWhatsAppRecipient()) {
                e.preventDefault()
                setShowWhatsAppModal(true)
              }
            }}
            className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Share to WhatsApp
          </a>
          {onExportPdf ? (
            <button
              type="button"
              onClick={() => onExportPdf(report)}
              className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Export PDF
            </button>
          ) : null}
          {onExportText ? (
            <button
              type="button"
              onClick={() => onExportText(report)}
              className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Export Text
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowComments((current) => !current)}
            aria-expanded={showComments}
            aria-label={`${showComments ? 'Hide' : 'Show'} mentor comments for ${dateLabel}`}
            className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showComments ? 'Hide comments' : 'Comments'}
          </button>
        </div>
      </div>
      {showComments ? (
        <SadhanaReportComments sadhanaReportId={report.id} />
      ) : null}
      {showWhatsAppModal ? (
        <WhatsAppShareModal
          open={showWhatsAppModal}
          report={report}
          onClose={() => setShowWhatsAppModal(false)}
        />
      ) : null}
    </div>
  )
}
