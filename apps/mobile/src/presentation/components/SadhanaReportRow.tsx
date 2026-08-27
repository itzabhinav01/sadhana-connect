import type { SadhanaReport } from '@sadhana-connect/domain'
import { buildWhatsAppShareUrl } from '@sadhana-connect/sadhana'
import { formatTime12Hour } from '@sadhana-connect/shared'
import { useRouter } from 'expo-router'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

interface SadhanaReportRowProps {
  report: SadhanaReport
  // 'compact' (dashboard's Recent Reports card): date + summary only.
  // 'detailed' (History): also sleep/wake when present. Same navigation
  // and share behavior either way — only how much is shown differs.
  variant?: 'compact' | 'detailed'
}

export function SadhanaReportRow({ report, variant = 'compact' }: SadhanaReportRowProps) {
  const router = useRouter()
  const hasSleepInfo = Boolean(report.sleepTime || report.wakeTime)

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push({ pathname: '/devotee/sadhana', params: { date: report.reportDate } })}
        accessibilityRole="button"
        accessibilityLabel={`Sadhana report for ${report.reportDate}`}
      >
        <Text style={styles.date}>{report.reportDate}</Text>
        <Text style={styles.summary}>
          {report.totalRounds} rounds · {report.readingMinutes}m reading · {report.hearingMinutes}m
          hearing
        </Text>
        {variant === 'detailed' && hasSleepInfo ? (
          <Text style={styles.muted}>
            {formatTime12Hour(report.sleepTime)} → {formatTime12Hour(report.wakeTime)}
          </Text>
        ) : null}
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL(buildWhatsAppShareUrl(report))}
        accessibilityRole="button"
        accessibilityLabel={`Share ${report.reportDate} report to WhatsApp`}
        style={styles.shareLink}
      >
        <Text style={styles.shareLinkText}>Share to WhatsApp</Text>
      </Pressable>
    </View>
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
  shareLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  shareLinkText: {
    fontSize: fontSize.sm,
    color: colors.link,
  },
})
