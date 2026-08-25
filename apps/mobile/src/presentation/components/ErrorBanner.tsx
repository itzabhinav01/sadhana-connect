import { StyleSheet, Text, View } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
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
