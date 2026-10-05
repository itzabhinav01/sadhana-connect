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
    <View style={variant === 'detailed' ? styles.detailedCard : styles.row}>
      <Pressable
        onPress={() => router.push({ pathname: '/devotee/sadhana', params: { date: report.reportDate } })}
        accessibilityRole="button"
        accessibilityLabel={`Sadhana report for ${report.reportDate}`}
        style={styles.reportHeaderPressable}
      >
        <View style={styles.dateHeaderRow}>
          <Text style={styles.date}>{report.reportDate}</Text>
          {variant === 'detailed' && hasSleepInfo ? (
            <Text style={styles.sleepBadge}>
              {formatTime12Hour(report.sleepTime)} → {formatTime12Hour(report.wakeTime)}
            </Text>
          ) : null}
        </View>
        <Text style={styles.summary}>
          {report.totalRounds} rounds · {report.readingMinutes}m reading · {report.hearingMinutes}m
          hearing
        </Text>
      </Pressable>
      <View
        style={[
          styles.actionsRow,
          variant === 'detailed' ? styles.actionsRowDetailed : null,
        ]}
      >
        <Pressable
          onPress={handleShareWhatsApp}
          accessibilityRole="button"
          accessibilityLabel={`Share ${report.reportDate} report to WhatsApp`}
          style={[styles.actionLink, styles.actionLinkPrimary]}
        >
          <Text style={[styles.actionLinkText, styles.actionLinkTextPrimary]} numberOfLines={1}>
            Share to WhatsApp
          </Text>
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
              <Text style={styles.actionLinkText} numberOfLines={1}>
                {isExportingPdf ? 'Preparing…' : 'Export PDF'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleExportText}
              accessibilityRole="button"
              accessibilityLabel={`Export ${report.reportDate} report as text`}
              style={styles.actionLink}
            >
              <Text style={styles.actionLinkText} numberOfLines={1}>
                Export Text
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCommentsOpen((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={
                commentsOpen
                  ? `Hide comments for ${report.reportDate}`
                  : `Comments for ${report.reportDate}`
              }
              style={[styles.actionLink, commentsOpen ? styles.actionLinkActive : null]}
            >
              <Text style={styles.actionLinkText} numberOfLines={1}>
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 4,
    },
    detailedCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    reportHeaderPressable: {
      gap: 3,
    },
    dateHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    date: {
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    sleepBadge: {
      fontSize: 11,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    summary: {
      fontSize: fontSize.xs + 1,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    actionsRowDetailed: {
      flexWrap: 'nowrap',
      paddingTop: 6,
      marginTop: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    actionLink: {
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionLinkPrimary: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    actionLinkActive: {
      borderColor: colors.primary,
    },
    actionLinkText: {
      fontSize: 11,
      fontFamily: fontFamily.medium,
      fontWeight: '500',
      color: colors.foreground,
    },
    actionLinkTextPrimary: {
      color: colors.primary,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
    },
    errorLine: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
  })
}
