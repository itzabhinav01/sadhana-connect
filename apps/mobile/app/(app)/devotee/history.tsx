import { useSadhanaHistory } from '@sadhana-connect/sadhana'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'
import { Link } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { SadhanaReportRow } from '../../../src/presentation/components/SadhanaReportRow'
import { fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

interface HistoryFilters {
  fromDate: string
  toDate: string
}

export default function HistoryScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [filters, setFilters] = useState<HistoryFilters>({ fromDate: '', toDate: '' })
  const today = getLocalDateIso()

  const historyQuery = useSadhanaHistory({
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  })

  const reports = historyQuery.data?.pages.flatMap((page) => page.reports) ?? []

  return (
    <ScrollView contentContainerStyle={styles.content}>
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

      <Text style={styles.mutedLine}>
        {filters.fromDate ? `From ${filters.fromDate}` : 'All time'}
      </Text>

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
      color: colors.muted,
    },
    errorLine: {
      fontSize: fontSize.sm,
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
