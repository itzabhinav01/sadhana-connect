import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, radius, spacing, fontFamily } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface CardProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function Card({ title, action, children }: CardProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {action}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      letterSpacing: 0.2,
      flexShrink: 1,
    },
    content: {
      gap: spacing.xs,
    },
  })
}
