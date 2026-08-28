import {
  getLastNDaysRange,
  useDevoteeReportHistory,
  validateDateRange,
  type SadhanaDateRange,
} from '@sadhana-connect/sadhana'
import type { SadhanaReportHistoryEntry } from '@sadhana-connect/domain'
import { buildDateRangeList } from '@sadhana-connect/shared'
import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { Button } from './Button'
import { Card } from './Card'
import { CommentThread } from './CommentThread'
import { DateRangeFields } from './DateRangeFields'
import { ErrorBanner } from './ErrorBanner'

type RangeOption = '7' | '14' | '30' | 'custom'

const QUICK_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '7', label: 'Last 1 week' },
  { value: '14', label: 'Last 2 weeks' },
  { value: '30', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
]

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

export function ReadOnlyReportRow({
  report,
  showComments,
}: {
  report: SadhanaReportHistoryEntry
  showComments: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [commentsOpen, setCommentsOpen] = useState(false)

  return (
    <View style={styles.reportRow}>
      <Text style={styles.reportDate}>{formatDisplayDate(report.reportDate)}</Text>
      <Text style={styles.rowMuted}>
        {report.totalRounds} rounds · {report.readingMinutes}m reading ·{' '}
        {report.hearingMinutes}m hearing
      </Text>
      {showComments ? (
        <>
          <Button
            title={commentsOpen ? 'Hide comments' : 'Comments'}
            variant="outline"
            onPress={() => setCommentsOpen((current) => !current)}
          />
          {commentsOpen ? <CommentThread sadhanaReportId={report.id} /> : null}
        </>
      ) : null}
    </View>
  )
}

interface DevoteeSadhanaHistorySectionProps {
  devoteeId: string
  // Only a mentor may comment on a report (mentor_comments RLS) — a
  // super admin viewing the same section on the admin user detail
  // screen sees the same reports without the comments affordance.
  showComments?: boolean
}

// Shared by the mentor devotee-detail screen and the admin user-detail
// screen — a mentor sees only their own assigned devotees here, an admin
// any devotee; both are enforced entirely by RLS
// (sadhana_reports_select/sadhana_report_comments_select), not by this
// component. Mirrors web's DevoteeSadhanaHistorySection, including the
// 366-day custom-range cap enforced by validateDateRange.
export function DevoteeSadhanaHistorySection({
  devoteeId,
  showComments = false,
}: DevoteeSadhanaHistorySectionProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
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
    <Card title="Sadhana History">
      <View style={styles.filterRow}>
        {QUICK_OPTIONS.map((quickOption) => (
          <Button
            key={quickOption.value}
            title={quickOption.label}
            variant={option === quickOption.value ? 'primary' : 'outline'}
            onPress={() => setOption(quickOption.value)}
          />
        ))}
      </View>

      {option === 'custom' ? (
        <DateRangeFields
          fromDate={customRange.fromDate}
          toDate={customRange.toDate}
          onFromDateChange={(fromDate) => setCustomRange({ ...customRange, fromDate })}
          onToDateChange={(toDate) => setCustomRange({ ...customRange, toDate })}
        />
      ) : null}

      {!validation.valid ? <Text style={styles.errorText}>{validation.error}</Text> : null}

      {validation.valid && historyQuery.isPending ? (
        <Text style={styles.rowMuted}>Loading…</Text>
      ) : null}
      {validation.valid && historyQuery.isError ? (
        <ErrorBanner message="Something went wrong loading this devotee's history." />
      ) : null}
      {validation.valid && historyQuery.isSuccess ? (
        <Text style={styles.rowMuted}>
          {missedDates.length === 0
            ? `All ${allDates.length} days filled in this range.`
            : `Missed ${missedDates.length} of ${allDates.length} days.`}
        </Text>
      ) : null}
      {validation.valid && historyQuery.isSuccess && historyQuery.data.length === 0 ? (
        <Text style={styles.rowMuted}>No reports in this range.</Text>
      ) : null}
      {validation.valid && historyQuery.isSuccess && historyQuery.data.length > 0
        ? [...historyQuery.data]
            .sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1))
            .map((report) => (
              <ReadOnlyReportRow key={report.id} report={report} showComments={showComments} />
            ))
        : null}
    </Card>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    rowMuted: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
    reportRow: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.xs,
    },
    reportDate: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: colors.foreground,
    },
  })
}
