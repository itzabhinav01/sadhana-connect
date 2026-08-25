import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>Loading…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
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
