import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, radius, spacing, fontFamily } from '../../shared/theme'
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
      <View style={styles.brand}>
        <Text style={styles.brandMark}>Sadhana Connect</Text>
      </View>
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
    brand: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    brandMark: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    card: {
      gap: spacing.xs,
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
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
