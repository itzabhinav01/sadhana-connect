import { useAuth } from '@sadhana-connect/auth'
import type { SadhanaReport } from '@sadhana-connect/domain'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import {
  buildSadhanaHistoryCsv,
  buildSadhanaHistoryHtml,
  buildSadhanaHistoryXlsxBase64,
  buildSadhanaRangeExportFilename,
  sadhanaQueryKeys,
  useSadhanaHistory,
  validateDateRange,
  type DateRangeValidationResult,
} from '@sadhana-connect/sadhana'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'
import { useQueryClient } from '@tanstack/react-query'
// SDK 57 replaced the top-level string-path API (cacheDirectory,
// writeAsStringAsync) with a new synchronous File/Directory class API —
// expo-file-system/legacy is Expo's own documented compatibility path,
// preserving the async, string-URI API this file (and expo-print's own
// promise-based printToFileAsync it sits alongside) already relies on.
import * as FileSystem from 'expo-file-system/legacy'
import * as Print from 'expo-print'
import { Link } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { DateRangeFields } from '../../../src/presentation/components/DateRangeFields'
import { SadhanaReportRow } from '../../../src/presentation/components/SadhanaReportRow'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

interface HistoryFilters {
  fromDate: string
  toDate: string
}

export default function HistoryScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { session } = useAuth()
  const userId = session?.userId ?? null
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<HistoryFilters>({ fromDate: '', toDate: '' })
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isExportingSheet, setIsExportingSheet] = useState(false)
  const [exportError, setExportError] = useState(false)
  const today = getLocalDateIso()
  const last30From = addDaysIso(today, -29)
  const last90From = addDaysIso(today, -89)

  const isLast30Active = filters.fromDate === last30From && filters.toDate === ''
  const isLast90Active = filters.fromDate === last90From && filters.toDate === ''
  const isAllTimeActive = filters.fromDate === '' && filters.toDate === ''

  const historyQuery = useSadhanaHistory({
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  })

  const reports = historyQuery.data?.pages.flatMap((page) => page.reports) ?? []

  // A bulk export requires a concrete, bounded range — deliberately
  // unavailable for "All time" (blank fromDate), which has no lower
  // bound to pass to either validateDateRange or listReportsInRange.
  // Mirrors web's HistoryPage (Phase 16) exactly.
  const exportFromDate = filters.fromDate
  const exportToDate = filters.toDate && filters.toDate < today ? filters.toDate : today
  const hasConcreteRange = exportFromDate !== ''
  const rangeValidation: DateRangeValidationResult = hasConcreteRange
    ? validateDateRange(exportFromDate, exportToDate)
    : { valid: false, error: 'Choose a specific date range (not All time) to export.' }
  const canExportRange = hasConcreteRange && rangeValidation.valid
  const isAnyExportBusy = isExportingPdf || isExportingCsv || isExportingSheet
  const exportDisabled = !canExportRange || isAnyExportBusy

  async function fetchRangeReports(): Promise<SadhanaReport[]> {
    if (!userId) throw new Error('HistoryScreen: no authenticated user')
    return queryClient.fetchQuery({
      queryKey: sadhanaQueryKeys.fullRange(userId, exportFromDate, exportToDate),
      queryFn: () =>
        supabaseSadhanaReportRepository.listFullReportsInRange(userId, exportFromDate, exportToDate),
    })
  }

  async function handleExportRangePdf() {
    setExportError(false)
    setIsExportingPdf(true)
    try {
      const rangeReports = await fetchRangeReports()
      const { uri } = await Print.printToFileAsync({
        html: buildSadhanaHistoryHtml(rangeReports, exportFromDate, exportToDate),
      })
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Sadhana Reports ${exportFromDate} to ${exportToDate}`,
      })
    } catch {
      setExportError(true)
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleExportRangeCsv() {
    setExportError(false)
    setIsExportingCsv(true)
    try {
      const rangeReports = await fetchRangeReports()
      const fileUri =
        FileSystem.cacheDirectory + buildSadhanaRangeExportFilename(exportFromDate, exportToDate, 'csv')
      await FileSystem.writeAsStringAsync(fileUri, buildSadhanaHistoryCsv(rangeReports), {
        encoding: FileSystem.EncodingType.UTF8,
      })
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Sadhana Reports ${exportFromDate} to ${exportToDate}`,
      })
    } catch {
      setExportError(true)
    } finally {
      setIsExportingCsv(false)
    }
  }

  async function handleExportRangeColoredSheet() {
    setExportError(false)
    setIsExportingSheet(true)
    try {
      const rangeReports = await fetchRangeReports()
      const fileUri =
        FileSystem.cacheDirectory + buildSadhanaRangeExportFilename(exportFromDate, exportToDate, 'xlsx')
      await FileSystem.writeAsStringAsync(
        fileUri,
        buildSadhanaHistoryXlsxBase64(rangeReports),
        {
          encoding: FileSystem.EncodingType.Base64,
        },
      )
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
        dialogTitle: `Sadhana Colored Sheet ${exportFromDate} to ${exportToDate}`,
      })
    } catch {
      setExportError(true)
    } finally {
      setIsExportingSheet(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.controlsCard}>
        {/* Quick Range Segmented Bar */}
        <View style={styles.segmentedRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Last 30 days"
            onPress={() => setFilters({ fromDate: last30From, toDate: '' })}
            style={[styles.segmentPill, isLast30Active ? styles.segmentPillActive : null]}
          >
            <Text
              style={[
                styles.segmentText,
                isLast30Active ? styles.segmentTextActive : null,
              ]}
            >
              Last 30 days
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Last 90 days"
            onPress={() => setFilters({ fromDate: last90From, toDate: '' })}
            style={[styles.segmentPill, isLast90Active ? styles.segmentPillActive : null]}
          >
            <Text
              style={[
                styles.segmentText,
                isLast90Active ? styles.segmentTextActive : null,
              ]}
            >
              Last 90 days
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="All time"
            onPress={() => setFilters({ fromDate: '', toDate: '' })}
            style={[styles.segmentPill, isAllTimeActive ? styles.segmentPillActive : null]}
          >
            <Text
              style={[
                styles.segmentText,
                isAllTimeActive ? styles.segmentTextActive : null,
              ]}
            >
              All time
            </Text>
          </Pressable>
        </View>

        {/* Custom From / To Date Pickers */}
        <DateRangeFields
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onFromDateChange={(fromDate) => setFilters({ ...filters, fromDate })}
          onToDateChange={(toDate) => setFilters({ ...filters, toDate })}
        />

        <View style={styles.controlsDivider} />

        {/* Single-Row Export Toolbar */}
        <View style={styles.exportToolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isExportingPdf ? 'Preparing…' : 'Export PDF'}
            accessibilityState={{ disabled: exportDisabled, busy: isExportingPdf }}
            disabled={exportDisabled}
            onPress={handleExportRangePdf}
            style={[styles.exportChip, exportDisabled ? styles.exportChipDisabled : null]}
          >
            <Text style={styles.exportChipText} numberOfLines={1}>
              {isExportingPdf ? 'Preparing…' : 'Export PDF'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isExportingSheet ? 'Preparing…' : 'Colored Sheet (.xlsx)'}
            accessibilityState={{ disabled: exportDisabled, busy: isExportingSheet }}
            disabled={exportDisabled}
            onPress={handleExportRangeColoredSheet}
            style={[
              styles.exportChip,
              styles.exportChipAccent,
              exportDisabled ? styles.exportChipDisabled : null,
            ]}
          >
            <Text
              style={[styles.exportChipText, styles.exportChipTextAccent]}
              numberOfLines={1}
            >
              {isExportingSheet ? 'Preparing…' : 'Colored Sheet (.xlsx)'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isExportingCsv ? 'Preparing…' : 'Export CSV'}
            accessibilityState={{ disabled: exportDisabled, busy: isExportingCsv }}
            disabled={exportDisabled}
            onPress={handleExportRangeCsv}
            style={[styles.exportChip, exportDisabled ? styles.exportChipDisabled : null]}
          >
            <Text style={styles.exportChipText} numberOfLines={1}>
              {isExportingCsv ? 'Preparing…' : 'Export CSV'}
            </Text>
          </Pressable>
        </View>

        {!canExportRange ? (
          <Text style={styles.helperHint}>
            {hasConcreteRange && !rangeValidation.valid
              ? rangeValidation.error
              : 'Choose a specific date range (not All time) to export.'}
          </Text>
        ) : null}
        {exportError ? (
          <Text style={styles.errorLine}>
            Something went wrong exporting your reports. Please try again.
          </Text>
        ) : null}
      </View>

      {historyQuery.isPending ? (
        <Text style={styles.mutedLine}>Loading…</Text>
      ) : historyQuery.isError ? (
        <Text style={styles.errorLine}>Something went wrong loading your history.</Text>
      ) : reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.mutedLine}>No Sadhana reports found for this range.</Text>
          <Link href="/devotee/sadhana" style={styles.link}>
            Fill Sadhana
          </Link>
        </View>
      ) : (
        <View style={styles.reportsList}>
          {reports.map((report) => (
            <SadhanaReportRow key={report.id} report={report} variant="detailed" />
          ))}
          {historyQuery.hasNextPage ? (
            <Button
              title="Load more"
              pendingTitle="Loading…"
              isPending={historyQuery.isFetchingNextPage}
              onPress={() => historyQuery.fetchNextPage()}
              variant="outline"
              size="sm"
            />
          ) : null}
        </View>
      )}
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    controlsCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.sm + 4,
      gap: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentedRow: {
      flexDirection: 'row',
      backgroundColor: colors.mutedBackground,
      borderRadius: radius.md,
      padding: 3,
      gap: 4,
    },
    segmentPill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderRadius: radius.sm + 2,
    },
    segmentPillActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      fontWeight: '500',
      color: colors.muted,
    },
    segmentTextActive: {
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    controlsDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    exportToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    exportChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    exportChipAccent: {
      flex: 1.35,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    exportChipDisabled: {
      opacity: 0.45,
    },
    exportChipText: {
      fontSize: 11,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
    exportChipTextAccent: {
      color: colors.primary,
    },
    helperHint: {
      fontSize: 11,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      textAlign: 'center',
    },
    reportsList: {
      gap: spacing.sm,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    errorLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.destructive,
    },
    emptyState: {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    link: {
      color: colors.link,
      textDecorationLine: 'underline',
    },
  })
}
