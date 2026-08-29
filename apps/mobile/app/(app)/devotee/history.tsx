import { useAuth } from '@sadhana-connect/auth'
import type { SadhanaReport } from '@sadhana-connect/domain'
import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import {
  buildSadhanaHistoryCsv,
  buildSadhanaHistoryHtml,
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
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { DateRangeFields } from '../../../src/presentation/components/DateRangeFields'
import { SadhanaReportRow } from '../../../src/presentation/components/SadhanaReportRow'
import { fontFamily, fontSize, spacing } from '../../../src/shared/theme'
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
  const [exportError, setExportError] = useState(false)
  const today = getLocalDateIso()

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

  async function fetchRangeReports(): Promise<SadhanaReport[]> {
    if (!userId) throw new Error('HistoryScreen: no authenticated user')
    return queryClient.fetchQuery({
      queryKey: sadhanaQueryKeys.range(userId, exportFromDate, exportToDate),
      queryFn: () =>
        supabaseSadhanaReportRepository.listReportsInRange(userId, exportFromDate, exportToDate),
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

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <DateRangeFields
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onFromDateChange={(fromDate) => setFilters({ ...filters, fromDate })}
        onToDateChange={(toDate) => setFilters({ ...filters, toDate })}
      />

      <View style={styles.filterRow}>
        <Button
          title="Last 30 days"
          variant="outline"
          onPress={() => setFilters({ fromDate: addDaysIso(today, -29), toDate: '' })}
        />
        <Button
          title="Last 90 days"
          variant="outline"
          onPress={() => setFilters({ fromDate: addDaysIso(today, -89), toDate: '' })}
        />
        <Button
          title="All time"
          variant="outline"
          onPress={() => setFilters({ fromDate: '', toDate: '' })}
        />
      </View>

      <View style={styles.filterRow}>
        <Button
          title="Export PDF"
          pendingTitle="Preparing…"
          isPending={isExportingPdf}
          disabled={!canExportRange || isExportingPdf || isExportingCsv}
          variant="outline"
          onPress={handleExportRangePdf}
        />
        <Button
          title="Export CSV"
          pendingTitle="Preparing…"
          isPending={isExportingCsv}
          disabled={!canExportRange || isExportingPdf || isExportingCsv}
          variant="outline"
          onPress={handleExportRangeCsv}
        />
      </View>
      {!canExportRange ? (
        <Text style={styles.mutedLine}>
          {hasConcreteRange && !rangeValidation.valid
            ? rangeValidation.error
            : 'Choose a specific date range (not All time) to export.'}
        </Text>
      ) : null}
      {exportError ? (
        <Text style={styles.errorLine}>Something went wrong exporting your reports. Please try again.</Text>
      ) : null}

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
        <>
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
            />
          ) : null}
        </>
      )}
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
