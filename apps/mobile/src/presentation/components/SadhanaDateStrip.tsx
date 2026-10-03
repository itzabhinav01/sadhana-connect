import { QueryClientContext } from '@tanstack/react-query'
import {
  supabaseAuthRepository,
  supabaseSadhanaReportRepository,
} from '@sadhana-connect/infra-supabase'
import { addDaysIso, buildDateRangeList, getLocalDateIso } from '@sadhana-connect/shared'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'

const MONTH_ABBR = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

function parseDayAndMonth(isoDate: string): { day: string; month: string } {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return { day: isoDate, month: '' }
  const monthIdx = Number(parts[1]) - 1
  const dayNum = Number(parts[2])
  return {
    day: String(Number.isNaN(dayNum) ? parts[2] : dayNum),
    month: MONTH_ABBR[monthIdx] ?? parts[1],
  }
}

interface SadhanaDateStripProps {
  selectedDate: string
  hasExistingReport: boolean
  onSelectDate: (isoDate: string) => void
}

export function SadhanaDateStrip({
  selectedDate,
  hasExistingReport,
  onSelectDate,
}: SadhanaDateStripProps) {
  const { resolvedTheme, colors } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const queryClient = useContext(QueryClientContext)
  const [fetchedLoggedDates, setFetchedLoggedDates] = useState<string[]>([])

  const today = getLocalDateIso()
  const fromDate = addDaysIso(today, -6)

  const stripDates = useMemo(() => {
    const recent7 = buildDateRangeList(fromDate, today)
    if (selectedDate && !recent7.includes(selectedDate)) {
      return [selectedDate, ...recent7]
    }
    return recent7
  }, [fromDate, today, selectedDate])

  useEffect(() => {
    if (!queryClient) return
    let cancelled = false
    supabaseAuthRepository
      .getSession()
      .then((session) =>
        session?.userId
          ? supabaseSadhanaReportRepository.listRecentReports(session.userId, 14)
          : [],
      )
      .then((reports) => {
        if (!cancelled && Array.isArray(reports)) {
          setFetchedLoggedDates(reports.map((r) => r.reportDate))
        }
      })
      .catch(() => {
        // Ignore background fetch errors in strip indicator
      })
    return () => {
      cancelled = true
    }
  }, [queryClient, selectedDate, hasExistingReport])

  const loggedDateSet = useMemo(() => {
    const set = new Set(fetchedLoggedDates)
    if (hasExistingReport) {
      set.add(selectedDate)
    }
    return set
  }, [fetchedLoggedDates, hasExistingReport, selectedDate])

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {stripDates.map((isoDate) => {
          const isSelected = isoDate === selectedDate
          const isLogged = loggedDateSet.has(isoDate)
          const { day, month } = parseDayAndMonth(isoDate)

          const cardStyle = isSelected
            ? styles.cardSelected
            : isLogged
              ? isDark
                ? styles.cardLoggedDark
                : styles.cardLoggedLight
              : isDark
                ? styles.cardMissedDark
                : styles.cardMissedLight

          const dayTextStyle = isSelected
            ? styles.textSelected
            : isLogged
              ? isDark
                ? styles.textLoggedDark
                : styles.textLoggedLight
              : isDark
                ? styles.textMissedDark
                : styles.textMissedLight

          return (
            <Pressable
              key={isoDate}
              onPress={() => onSelectDate(isoDate)}
              accessibilityRole="button"
              accessibilityLabel={`Select date ${isoDate}`}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.cardBase,
                cardStyle,
                pressed && styles.cardPressed,
              ]}
            >
              {isLogged && !isSelected ? (
                <View
                  style={[
                    styles.loggedBottomTint,
                    { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.22)' : 'rgba(245, 158, 11, 0.16)' },
                  ]}
                />
              ) : null}
              <Text style={[styles.dayNumber, dayTextStyle]}>{day}</Text>
              <Text style={[styles.monthLabel, dayTextStyle]}>{month}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
          <Text style={[styles.legendText, { color: colors.muted }]}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={[styles.legendText, { color: colors.muted }]}>Filled</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                borderWidth: 1.5,
                borderColor: '#f43f5e',
                borderStyle: 'dashed',
                backgroundColor: 'transparent',
              },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.muted }]}>Pending</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  cardBase: {
    width: 60,
    height: 78,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    gap: 2,
  },
  cardSelected: {
    backgroundColor: '#2563eb',
    borderWidth: 1.5,
    borderColor: '#60a5fa',
    shadowColor: '#2563eb',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardLoggedDark: {
    backgroundColor: '#1e1b2e',
    borderWidth: 1.5,
    borderColor: '#d97706',
  },
  cardLoggedLight: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#d97706',
  },
  cardMissedDark: {
    backgroundColor: '#1b2234',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#e11d48',
  },
  cardMissedLight: {
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#f43f5e',
  },
  loggedBottomTint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
  },
  cardPressed: {
    opacity: 0.85,
  },
  dayNumber: {
    fontSize: fontSize.lg + 2,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    lineHeight: 26,
  },
  monthLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0.8,
  },
  textSelected: {
    color: '#ffffff',
  },
  textLoggedDark: {
    color: '#fbbf24',
  },
  textLoggedLight: {
    color: '#b45309',
  },
  textMissedDark: {
    color: '#fda4af',
  },
  textMissedLight: {
    color: '#e11d48',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  legendText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
  },
})
