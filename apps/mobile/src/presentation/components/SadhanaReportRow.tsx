import { formatTime12Hour } from '@sadhana-connect/shared'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

interface SadhanaReportRowProps {
  reportDate: string
  totalRounds: number
  readingMinutes: number
  hearingMinutes: number
  sleepTime?: string | null
  wakeTime?: string | null
}

export function SadhanaReportRow({
  reportDate,
  totalRounds,
  readingMinutes,
  hearingMinutes,
  sleepTime,
  wakeTime,
}: SadhanaReportRowProps) {
  const router = useRouter()
  const hasSleepInfo = Boolean(sleepTime || wakeTime)

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/devotee/sadhana', params: { date: reportDate } })}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`Sadhana report for ${reportDate}`}
    >
      <Text style={styles.date}>{reportDate}</Text>
      <Text style={styles.summary}>
        {totalRounds} rounds · {readingMinutes}m reading · {hearingMinutes}m hearing
      </Text>
      {hasSleepInfo ? (
        <Text style={styles.muted}>
          {formatTime12Hour(sleepTime)} → {formatTime12Hour(wakeTime)}
        </Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  date: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
  },
  summary: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
})
