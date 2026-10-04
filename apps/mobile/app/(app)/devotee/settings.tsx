import Constants from 'expo-constants'
import { useMemo } from 'react'
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import type { Theme } from '../../../src/application/theme/theme-context'
import { Button } from '../../../src/presentation/components/Button'
import { Card } from '../../../src/presentation/components/Card'
import { AppUpdateSection } from '../../../src/presentation/components/AppUpdateSection'
import { DailySadhanaReminderSection } from '../../../src/presentation/components/DailySadhanaReminderSection'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

export const GITHUB_REPO_URL = 'https://github.com/itzabhinav01/sadhana-connect'

const THEME_OPTIONS: { label: string; value: Theme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Card title="Appearance">
        <View style={styles.actions}>
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              size="sm"
              variant={theme === option.value ? 'primary' : 'outline'}
              onPress={() => setTheme(option.value)}
            />
          ))}
        </View>
      </Card>

      <DailySadhanaReminderSection />

      <AppUpdateSection />

      <Card title="About Sadhana Connect">
        <View style={styles.aboutHeader}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.aboutLogo}
            accessibilityLabel="Sadhana Connect Logo"
          />
          <View style={styles.aboutTextGroup}>
            <View style={styles.aboutTitleRow}>
              <Text style={styles.aboutTitle}>Sadhana Connect</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Open Source</Text>
              </View>
            </View>
            <Text style={styles.mutedLine}>
              Daily Sadhana reporting, Japa meditation counter, mentor guidance, and AI-assisted spiritual analytics.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{appVersion}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Repository</Text>
          <Text style={styles.repoText} selectable>
            github.com/itzabhinav01/sadhana-connect
          </Text>
        </View>

        <Button
          title="View on GitHub"
          size="sm"
          variant="outline"
          onPress={() => void Linking.openURL(GITHUB_REPO_URL)}
        />
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
      flexGrow: 1,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    aboutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    aboutLogo: {
      width: 56,
      height: 56,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    aboutTextGroup: {
      flex: 1,
      gap: 4,
    },
    aboutTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    aboutTitle: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    badge: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderWidth: 0.5,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.primary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    mutedLine: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    label: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    value: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
    repoText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.medium,
      color: colors.primary,
      flexShrink: 1,
    },
  })
}
