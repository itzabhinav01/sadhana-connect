import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface AuthCardProps {
  title: string
  description?: string
  children: ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        <View style={styles.content}>{children}</View>
      </View>
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    card: {
      gap: spacing.xs,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.foreground,
    },
    description: {
      fontSize: fontSize.base,
      color: colors.muted,
    },
    content: {
      marginTop: spacing.md,
      gap: spacing.md,
    },
  })
}
