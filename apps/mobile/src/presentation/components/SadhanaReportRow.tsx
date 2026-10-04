import type { SadhanaReport } from '@sadhana-connect/domain'
import {
  buildSadhanaReportHtml,
  buildWhatsAppShareUrl,
  formatSadhanaReportForText,
  getConfiguredWhatsAppRecipient,
  shouldPromptForWhatsAppRecipient,
} from '@sadhana-connect/sadhana'
import { formatTime12Hour } from '@sadhana-connect/shared'
import * as Print from 'expo-print'
import { useRouter } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { useMemo, useState } from 'react'
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing, fontFamily } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { SadhanaReportComments } from './SadhanaReportComments'
import { WhatsAppShareModal } from './WhatsAppShareModal'

interface SadhanaReportRowProps {
  report: SadhanaReport
  // 'compact' (dashboard's Recent Reports card): date + summary + WhatsApp
  // share only. 'detailed' (History): also sleep/wake when present, plus
  // Export PDF/Text and Comments — matching web's Dashboard-vs-History split.
  variant?: 'compact' | 'detailed'
}

export function SadhanaReportRow({ report, variant = 'compact' }: SadhanaReportRowProps) {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportError, setExportError] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const hasSleepInfo = Boolean(report.sleepTime || report.wakeTime)

  const handleShareWhatsApp = () => {
    const effectiveNumber = getConfiguredWhatsAppRecipient()
    if (effectiveNumber) {
      void Linking.openURL(buildWhatsAppShareUrl(report, effectiveNumber))
      return
    }
    if (shouldPromptForWhatsAppRecipient()) {
      setShowWhatsAppModal(true)
      return
    }
    void Linking.openURL(buildWhatsAppShareUrl(report))
  }

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
          onPress={handleShareWhatsApp}
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
            <Pressable
              onPress={() => setCommentsOpen((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={
                commentsOpen
                  ? `Hide comments for ${report.reportDate}`
                  : `Comments for ${report.reportDate}`
              }
              style={styles.actionLink}
            >
              <Text style={styles.actionLinkText}>
                {commentsOpen ? 'Hide comments' : 'Comments'}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
      {exportError ? (
        <Text style={styles.errorLine}>Something went wrong exporting this report. Please try again.</Text>
      ) : null}
      {variant === 'detailed' && commentsOpen ? (
        <SadhanaReportComments sadhanaReportId={report.id} />
      ) : null}
      {showWhatsAppModal ? (
        <WhatsAppShareModal
          visible={showWhatsAppModal}
          report={report}
          onClose={() => setShowWhatsAppModal(false)}
        />
      ) : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 2,
    },
    date: {
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
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
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    actionLink: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.mutedBackground,
    },
    actionLinkText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      fontWeight: '500',
      color: colors.link,
    },
    errorLine: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
  })
}
