import {
  buildSadhanaHistoryCsv,
  buildSadhanaHistoryHtml,
  buildSadhanaRangeExportFilename,
  getLastNDaysRange,
  sadhanaQueryKeys,
  useDevoteeReportHistory,
  validateDateRange,
  type SadhanaDateRange,
} from '@sadhana-connect/sadhana'
import type { SadhanaReport, SadhanaReportHistoryEntry } from '@sadhana-connect/domain'
import {
  buildDateRangeList,
  formatIsoDateAsDdMmYyyy,
  formatTime12Hour,
} from '@sadhana-connect/shared'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import { useQueryClient } from '@tanstack/react-query'
import * as FileSystem from 'expo-file-system'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing, fontFamily, radius } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { Button } from './Button'
import { Card } from './Card'
import { CommentThread } from './CommentThread'
import { DateRangeFields } from './DateRangeFields'
import { ErrorBanner } from './ErrorBanner'
import { Icon } from './Icon'

type RangeOption = '7' | '14' | '30' | 'custom'

const QUICK_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '7', label: 'Last 1 week' },
  { value: '14', label: 'Last 2 weeks' },
  { value: '30', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
]

function formatDisplayDate(iso: string) {
  return formatIsoDateAsDdMmYyyy(iso)
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

function ReportDetailCard({
  report,
  colors,
}: {
  report: SadhanaReport
  colors: ThemeColors
}) {
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailDate}>{formatDisplayDate(report.reportDate)}</Text>

      {/* Chanting */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeader}>Chanting</Text>
        <Text style={styles.detailText}>
          Total: <Text style={styles.boldText}>{report.totalRounds} Rounds</Text> · Before 4:30 AM: {report.roundsBefore430} · Till 7 AM: {report.roundsTill7am}
        </Text>
        {report.lastRoundTime ? (
          <Text style={styles.detailMuted}>Last round: {formatTime12Hour(report.lastRoundTime)}</Text>
        ) : null}
      </View>

      {/* Study */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeader}>Study</Text>
        <Text style={styles.detailText}>
          Reading: {report.readingMinutes} min {report.bookName ? `(${report.bookName})` : ''}
        </Text>
        <Text style={styles.detailText}>
          Hearing: {report.hearingMinutes} min {report.speakerName ? `(${report.speakerName})` : ''}
        </Text>
      </View>

      {/* Rest & Sleep */}
      {(report.sleepTime || report.wakeTime || report.dayRestMinutes > 0 || report.totalRestMinutes > 0) ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Rest & Sleep</Text>
          {report.sleepTime || report.wakeTime ? (
            <Text style={styles.detailText}>
              Sleep: {formatTime12Hour(report.sleepTime)} → Wake: {formatTime12Hour(report.wakeTime)}
            </Text>
          ) : null}
          <Text style={styles.detailMuted}>
            Day rest: {report.dayRestMinutes} min · Total rest: {report.totalRestMinutes} hr
          </Text>
        </View>
      ) : null}

      {/* Notes & Signature */}
      {report.notes ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Notes</Text>
          <Text style={styles.detailText}>{report.notes}</Text>
        </View>
      ) : null}
      {report.signatureText ? (
        <Text style={styles.detailSignature}>Ys, {report.signatureText}</Text>
      ) : null}
    </View>
  )
}

interface DevoteeSadhanaHistorySectionProps {
  devoteeId: string
  devoteeName?: string
  showComments?: boolean
}

export function DevoteeSadhanaHistorySection({
  devoteeId,
  devoteeName,
  showComments = false,
}: DevoteeSadhanaHistorySectionProps) {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const viewerUserId = session?.userId ?? null
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [option, setOption] = useState<RangeOption>('7')
  const [customRange, setCustomRange] = useState<SadhanaDateRange>(() => getLastNDaysRange(7))
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [previewReports, setPreviewReports] = useState<SadhanaReport[]>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [exportError, setExportError] = useState(false)

  const range = option === 'custom' ? customRange : getLastNDaysRange(Number(option))
  const validation = validateDateRange(range.fromDate, range.toDate)

  const historyQuery = useDevoteeReportHistory(devoteeId, range.fromDate, range.toDate, {
    enabled: validation.valid,
  })

  const allDates = validation.valid ? buildDateRangeList(range.fromDate, range.toDate) : []
  const filledDates = new Set(historyQuery.data?.map((report) => report.reportDate) ?? [])
  const missedDates = allDates.filter((date) => !filledDates.has(date))

  async function fetchFullReports(): Promise<SadhanaReport[]> {
    return queryClient.fetchQuery({
      queryKey: sadhanaQueryKeys.devoteeFullHistory(
        viewerUserId,
        devoteeId,
        range.fromDate,
        range.toDate,
      ),
      queryFn: () =>
        supabaseSadhanaReportRepository.listFullReportsInRange(
          devoteeId,
          range.fromDate,
          range.toDate,
        ),
    })
  }

  async function handleOpenPreview() {
    setExportError(false)
    setIsPreviewOpen(true)
    setIsLoadingPreview(true)
    try {
      const reports = await fetchFullReports()
      setPreviewReports(reports)
    } catch {
      setExportError(true)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  async function handleExportPdf() {
    setExportError(false)
    setIsExportingPdf(true)
    try {
      const reports = await fetchFullReports()
      const html = buildSadhanaHistoryHtml(reports, range.fromDate, range.toDate, devoteeName)
      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Sadhana Reports ${range.fromDate} to ${range.toDate}`,
      })
    } catch {
      setExportError(true)
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleExportCsv() {
    setExportError(false)
    setIsExportingCsv(true)
    try {
      const reports = await fetchFullReports()
      const filename = buildSadhanaRangeExportFilename(range.fromDate, range.toDate, 'csv')
      const fileUri = `${FileSystem.cacheDirectory ?? ''}${filename}`
      await FileSystem.writeAsStringAsync(fileUri, buildSadhanaHistoryCsv(reports), {
        encoding: FileSystem.EncodingType.UTF8,
      })
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Sadhana Reports ${range.fromDate} to ${range.toDate}`,
      })
    } catch {
      setExportError(true)
    } finally {
      setIsExportingCsv(false)
    }
  }

  const sortedPreviewReports = useMemo(
    () => [...previewReports].sort((a, b) => a.reportDate.localeCompare(b.reportDate)),
    [previewReports],
  )
  const totalRounds = sortedPreviewReports.reduce((acc, r) => acc + r.totalRounds, 0)
  const totalReading = sortedPreviewReports.reduce((acc, r) => acc + r.readingMinutes, 0)
  const totalHearing = sortedPreviewReports.reduce((acc, r) => acc + r.hearingMinutes, 0)

  return (
    <>
      {/* In-App Sadhana PDF / Full Report Preview Modal */}
      <Modal
        visible={isPreviewOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPreviewOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Text style={styles.modalTitle}>Sadhana Report</Text>
              <Text style={styles.modalSubtitle}>
                {devoteeName ? `${devoteeName} · ` : ''}
                {formatDisplayDate(range.fromDate)} to {formatDisplayDate(range.toDate)}
              </Text>
            </View>
            <Button title="Close" variant="outline" onPress={() => setIsPreviewOpen(false)} />
          </View>

          {/* Quick Metrics Bar */}
          {!isLoadingPreview && previewReports.length > 0 ? (
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Reports</Text>
                <Text style={styles.metricValue}>{previewReports.length} days</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Rounds</Text>
                <Text style={styles.metricValue}>{totalRounds}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Reading</Text>
                <Text style={styles.metricValue}>{totalReading}m</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Hearing</Text>
                <Text style={styles.metricValue}>{totalHearing}m</Text>
              </View>
            </View>
          ) : null}

          {/* Action Buttons Inside Modal */}
          <View style={styles.modalActionBar}>
            <Button
              title="Export PDF"
              variant="primary"
              pendingTitle="Exporting…"
              isPending={isExportingPdf}
              onPress={handleExportPdf}
              disabled={isLoadingPreview || previewReports.length === 0}
            />
            <Button
              title="Export CSV"
              variant="outline"
              pendingTitle="Exporting…"
              isPending={isExportingCsv}
              onPress={handleExportCsv}
              disabled={isLoadingPreview || previewReports.length === 0}
            />
          </View>

          {/* Document Content */}
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {isLoadingPreview ? (
              <Text style={styles.rowMuted}>Loading Sadhana reports…</Text>
            ) : previewReports.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.rowMuted}>No Sadhana reports found in this date range.</Text>
              </View>
            ) : (
              sortedPreviewReports.map((report) => (
                <ReportDetailCard key={report.id} report={report} colors={colors} />
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      <Card title="Sadhana History">
        {/* 1. Time Period Range Selector */}
        <View style={styles.sectionControlBlock}>
          <View style={styles.sectionLabelRow}>
            <Icon name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.sectionControlLabel}>Select Time Period</Text>
          </View>
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
        </View>

        <View style={styles.sectionDivider} />

        {/* 2. Report Actions & Downloads */}
        <View style={styles.sectionControlBlock}>
          <View style={styles.sectionLabelRow}>
            <Icon name="document-text-outline" size={14} color={colors.primary} />
            <Text style={styles.sectionControlLabel}>Report & Export Actions</Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            <Pressable
              style={[styles.previewButton, !validation.valid ? styles.disabledButton : null]}
              onPress={handleOpenPreview}
              disabled={!validation.valid}
              accessibilityRole="button"
              accessibilityLabel="Preview Report"
            >
              <Icon name="eye-outline" size={18} color={colors.primary} />
              <Text style={styles.previewButtonText}>Preview Report</Text>
            </Pressable>

            <View style={styles.exportRow}>
              <Pressable
                style={[
                  styles.exportButton,
                  !validation.valid || isExportingPdf ? styles.disabledButton : null,
                ]}
                onPress={handleExportPdf}
                disabled={!validation.valid || isExportingPdf}
                accessibilityRole="button"
                accessibilityLabel="Export PDF"
              >
                <Icon name="download-outline" size={15} color={colors.foreground} />
                <Text style={styles.exportButtonText}>
                  {isExportingPdf ? 'Exporting…' : 'Export PDF'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.exportButton,
                  !validation.valid || isExportingCsv ? styles.disabledButton : null,
                ]}
                onPress={handleExportCsv}
                disabled={!validation.valid || isExportingCsv}
                accessibilityRole="button"
                accessibilityLabel="Export CSV"
              >
                <Icon name="stats-chart-outline" size={15} color={colors.foreground} />
                <Text style={styles.exportButtonText}>
                  {isExportingCsv ? 'Exporting…' : 'Export CSV'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {!validation.valid ? <Text style={styles.errorText}>{validation.error}</Text> : null}
        {exportError ? (
          <Text style={styles.errorText}>
            Something went wrong exporting Sadhana reports. Please try again.
          </Text>
        ) : null}

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
    </>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionControlBlock: {
      gap: spacing.xs,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    sectionControlLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.muted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    actionButtonsContainer: {
      gap: spacing.xs,
    },
    previewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    previewButtonText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
    },
    exportRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    exportButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    exportButtonText: {
      color: colors.foreground,
      fontSize: fontSize.xs + 1,
      fontFamily: fontFamily.medium,
      fontWeight: '500',
    },
    disabledButton: {
      opacity: 0.5,
    },
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
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalHeaderLeft: {
      flex: 1,
      gap: 2,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    modalSubtitle: {
      fontSize: fontSize.xs,
      color: colors.muted,
    },
    metricsBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      padding: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      justifyContent: 'space-around',
    },
    metricItem: {
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: fontSize.xs,
      color: colors.muted,
    },
    metricValue: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    modalActionBar: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalScrollContent: {
      padding: spacing.md,
      gap: spacing.md,
    },
    detailCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    detailDate: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.xs,
    },
    sectionBlock: {
      gap: 2,
    },
    sectionHeader: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailText: {
      fontSize: fontSize.sm,
      color: colors.foreground,
    },
    detailMuted: {
      fontSize: fontSize.xs,
      color: colors.muted,
    },
    boldText: {
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
    },
    detailSignature: {
      fontSize: fontSize.xs,
      fontStyle: 'italic',
      color: colors.muted,
      marginTop: spacing.xs,
    },
    emptyCard: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: radius.md,
    },
  })
}
