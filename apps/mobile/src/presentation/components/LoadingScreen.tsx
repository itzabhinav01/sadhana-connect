import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

export function LoadingScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>Loading…</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.background,
    },
    text: {
      fontSize: fontSize.base,
      color: colors.muted,
    },
  })
}
