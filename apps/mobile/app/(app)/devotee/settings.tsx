import Constants from 'expo-constants'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import type { Theme } from '../../../src/application/theme/theme-context'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { AppUpdateSection } from '../../../src/presentation/components/AppUpdateSection'
import { DailySadhanaReminderSection } from '../../../src/presentation/components/DailySadhanaReminderSection'
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
    <ScrollView contentContainerStyle={styles.content}>
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

      <DailySadhanaReminderSection />

      <AppUpdateSection />

      <Card title="App Info">
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{appVersion}</Text>
        </View>
      </Card>
    </ScrollView>
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
