import type { SadhanaReport } from '@sadhana-connect/domain'
import {
  buildSadhanaReportHtml,
  buildWhatsAppShareUrl,
  formatSadhanaReportForText,
} from '@sadhana-connect/sadhana'
import { formatTime12Hour } from '@sadhana-connect/shared'
import * as Print from 'expo-print'
import { useRouter } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { useState } from 'react'
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

interface SadhanaReportRowProps {
  report: SadhanaReport
  // 'compact' (dashboard's Recent Reports card): date + summary + WhatsApp
  // share only. 'detailed' (History): also sleep/wake when present, plus
  // Export PDF/Text — matching web's Dashboard-vs-History split, where
  // export actions are History-only (Phase 16 approved product decision).
  variant?: 'compact' | 'detailed'
}

export function SadhanaReportRow({ report, variant = 'compact' }: SadhanaReportRowProps) {
  const router = useRouter()
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportError, setExportError] = useState(false)
  const hasSleepInfo = Boolean(report.sleepTime || report.wakeTime)

  const handleExportText = () => {
    Share.share({ message: formatSadhanaReportForText(report) })
  }

  // Native has no browser print API, so this renders the same field data
  // as web's SadhanaExportPrintView to a real PDF file via expo-print,
  // then hands it to the native share sheet (save, email, etc.) via
  // expo-sharing.
  const handleExportPdf = async () => {
    setExportError(false)
    setIsExportingPdf(true)
    try {
      const { uri } = await Print.printToFileAsync({ html: buildSadhanaReportHtml(report) })
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Sadhana Report ${report.reportDate}`,
      })
    } catch {
      setExportError(true)
    } finally {
      setIsExportingPdf(false)
    }
  }

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
      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => Linking.openURL(buildWhatsAppShareUrl(report))}
          accessibilityRole="button"
          accessibilityLabel={`Share ${report.reportDate} report to WhatsApp`}
          style={styles.actionLink}
        >
          <Text style={styles.actionLinkText}>Share to WhatsApp</Text>
        </Pressable>
        {variant === 'detailed' ? (
          <>
            <Pressable
              onPress={handleExportPdf}
              disabled={isExportingPdf}
              accessibilityRole="button"
              accessibilityLabel={`Export ${report.reportDate} report as PDF`}
              style={styles.actionLink}
            >
              <Text style={styles.actionLinkText}>
                {isExportingPdf ? 'Preparing…' : 'Export PDF'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleExportText}
              accessibilityRole="button"
              accessibilityLabel={`Export ${report.reportDate} report as text`}
              style={styles.actionLink}
            >
              <Text style={styles.actionLinkText}>Export Text</Text>
            </Pressable>
          </>
        ) : null}
      </View>
      {exportError ? (
        <Text style={styles.errorLine}>Something went wrong exporting this report. Please try again.</Text>
      ) : null}
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionLink: {
    paddingVertical: spacing.xs,
  },
  actionLinkText: {
    fontSize: fontSize.sm,
    color: colors.link,
  },
  errorLine: {
    fontSize: fontSize.sm,
    color: colors.destructive,
  },
})
