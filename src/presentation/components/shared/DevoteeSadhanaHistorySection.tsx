import { useState } from 'react'

import {
  getLastNDaysRange,
  validateDateRange,
  type SadhanaDateRange,
} from '@sadhana-connect/sadhana'
import { useDevoteeReportHistory } from '@sadhana-connect/sadhana'
import { buildDateRangeList, formatIsoDateLong } from '@sadhana-connect/shared'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { DateRangeInputs } from '@/presentation/components/shared/DateRangeInputs'
import { SendReminderForm } from '@/presentation/components/shared/SendReminderForm'
import { MentorDevoteeReportRow } from '@/presentation/pages/mentor/MentorDevoteeReportRow'

type RangeOption = '7' | '14' | '30' | 'custom'

const QUICK_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '7', label: 'Last 1 week' },
  { value: '14', label: 'Last 2 weeks' },
  { value: '30', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
]

function formatDisplayDate(iso: string) {
  return formatIsoDateLong(iso)
}

interface DevoteeSadhanaHistorySectionProps {
  devoteeId: string
}

// Shared by MentorDevoteeDetailPage and AdminUserDetailPage (Phase 20B) —
// a mentor sees only their own assigned devotees here, an admin any
// devotee; both are enforced entirely by RLS
// (sadhana_reports_select/sadhana_report_comments_select), not by this
// component. Missed days are computed client-side by diffing the full
// calendar range against the report_date values actually returned — no
// new query, same technique History/Analytics already use for gap days.
export function DevoteeSadhanaHistorySection({ devoteeId }: DevoteeSadhanaHistorySectionProps) {
  const [option, setOption] = useState<RangeOption>('7')
  const [customRange, setCustomRange] = useState<SadhanaDateRange>(() => getLastNDaysRange(7))

  const range = option === 'custom' ? customRange : getLastNDaysRange(Number(option))
  const validation = validateDateRange(range.fromDate, range.toDate)

  const historyQuery = useDevoteeReportHistory(devoteeId, range.fromDate, range.toDate, {
    enabled: validation.valid,
  })

  const allDates = validation.valid ? buildDateRangeList(range.fromDate, range.toDate) : []
  const filledDates = new Set(historyQuery.data?.map((report) => report.reportDate) ?? [])
  const missedDates = allDates.filter((date) => !filledDates.has(date))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Sadhana History</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_OPTIONS.map((quickOption) => (
              <Button
                key={quickOption.value}
                type="button"
                variant={option === quickOption.value ? 'default' : 'outline'}
                size="sm"
                aria-pressed={option === quickOption.value}
                onClick={() => setOption(quickOption.value)}
              >
                {quickOption.label}
              </Button>
            ))}
          </div>

          {option === 'custom' ? (
            <DateRangeInputs
              idPrefix="devotee-history"
              fromDate={customRange.fromDate}
              toDate={customRange.toDate}
              onFromDateChange={(fromDate) => setCustomRange({ ...customRange, fromDate })}
              onToDateChange={(toDate) => setCustomRange({ ...customRange, toDate })}
            />
          ) : null}

          {!validation.valid ? (
            <p role="alert" className="text-sm text-destructive">
              {validation.error}
            </p>
          ) : null}

          {validation.valid && historyQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {validation.valid && historyQuery.isError ? (
            <p className="text-sm text-destructive">
              Something went wrong loading this devotee&apos;s history.
            </p>
          ) : null}

          {validation.valid && historyQuery.isSuccess ? (
            <p className="text-sm text-muted-foreground">
              {missedDates.length === 0
                ? `All ${allDates.length} days filled in this range.`
                : `Missed ${missedDates.length} of ${allDates.length} days: ${missedDates
                    .map(formatDisplayDate)
                    .join(', ')}`}
            </p>
          ) : null}

          {validation.valid && historyQuery.isSuccess && historyQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports in this range.</p>
          ) : null}

          {validation.valid && historyQuery.isSuccess && historyQuery.data.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {[...historyQuery.data]
                .sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1))
                .map((report) => (
                  <li key={report.id}>
                    <MentorDevoteeReportRow report={report} />
                  </li>
                ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <SendReminderForm devoteeId={devoteeId} />
    </div>
  )
}
