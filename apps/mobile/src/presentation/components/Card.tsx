import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface CardProps {
  title: string
  children: ReactNode
}

export function Card({ title, children }: CardProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      backgroundColor: colors.card,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: colors.foreground,
      letterSpacing: 0.2,
    },
    content: {
      gap: spacing.xs,
    },
  })
}
