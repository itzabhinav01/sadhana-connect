import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

type ChipTone = 'neutral' | 'accent' | 'success' | 'warning' | 'destructive'

interface ChipProps {
  label: string
  tone?: ChipTone
}

// Small pill for status words — "Pinned", "Unread", the retention
// grace-period notice — replacing the three hand-rolled inline Text
// badges that existed across announcements/notifications/dashboard
// before this redesign, each with its own shape.
export function Chip({ label, tone = 'neutral' }: ChipProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const toneStyle = {
    neutral: styles.neutral,
    accent: styles.accent,
    success: styles.success,
    warning: styles.warning,
    destructive: styles.destructive,
  }[tone]
  const toneTextStyle = {
    neutral: styles.neutralText,
    accent: styles.accentText,
    success: styles.successText,
    warning: styles.warningText,
    destructive: styles.destructiveText,
  }[tone]

  return (
    <View style={[styles.chip, toneStyle]}>
      <Text style={[styles.text, toneTextStyle]}>{label}</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chip: {
      alignSelf: 'flex-start',
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    text: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
    },
    neutral: { backgroundColor: colors.mutedBackground },
    neutralText: { color: colors.muted },
    accent: { backgroundColor: colors.primarySoft },
    accentText: { color: colors.primary },
    success: { backgroundColor: colors.successBackground },
    successText: { color: colors.success },
    warning: { backgroundColor: colors.warningBackground },
    warningText: { color: colors.warning },
    destructive: { backgroundColor: colors.destructiveBackground },
    destructiveText: { color: colors.destructive },
  })
}
