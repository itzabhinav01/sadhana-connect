import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

interface CardProps {
  title: string
  children: ReactNode
}

export function Card({ title, children }: CardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.card,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.foreground,
  },
  content: {
    gap: spacing.xs,
  },
})
