import Constants from 'expo-constants'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import type { Theme } from '../../../src/application/theme/theme-context'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { fontFamily, fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const THEME_OPTIONS: { label: string; value: Theme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const appVersion = Constants.expoConfig?.version ?? '—'

  return (
    <View style={styles.content}>
      <Card title="Appearance">
        <View style={styles.actions}>
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              variant={theme === option.value ? 'primary' : 'outline'}
              onPress={() => setTheme(option.value)}
            />
          ))}
        </View>
      </Card>

      <Card title="Notifications">
        <Text style={styles.mutedLine}>
          Sadhana reminders are sent by your mentor when needed. Per-preference controls aren&apos;t
          available yet.
        </Text>
      </Card>

      <Card title="App Info">
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{appVersion}</Text>
        </View>
      </Card>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    value: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
  })
}
