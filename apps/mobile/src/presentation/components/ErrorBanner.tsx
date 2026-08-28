import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

export function ErrorBanner({ message }: { message: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.destructiveBackground,
      borderRadius: 8,
      padding: spacing.sm + 2,
    },
    text: {
      color: colors.destructiveForeground,
      fontSize: fontSize.sm,
    },
  })
}
