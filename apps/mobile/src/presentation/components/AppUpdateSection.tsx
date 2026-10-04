import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { useAppUpdates } from '../hooks/use-app-updates'
import { AppUpdateModal } from './AppUpdateModal'
import { Button } from './Button'

export function AppUpdateSection() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const {
    isSupported,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    updatePrompt,
    dismissUpdatePrompt,
    checkForUpdates,
    downloadAndApplyUpdate,
  } = useAppUpdates({ promptUserOnUpdate: false, useThemedModal: true })

  return (
    <View style={styles.container}>
      {isUpdateAvailable ? (
        <View style={styles.updateAvailableBox}>
          <View style={styles.textColumn}>
            <Text style={styles.title}>App Updates</Text>
            <Text style={styles.updateAvailableText}>A new update is available!</Text>
          </View>
          <Button
            title="Update & Restart Now"
            pendingTitle="Updating…"
            isPending={isDownloading}
            size="sm"
            onPress={() => void downloadAndApplyUpdate()}
          />
        </View>
      ) : (
        <View style={styles.compactRow}>
          <View style={styles.textColumn}>
            <Text style={styles.title}>App Updates</Text>
            <Text style={styles.mutedText}>
              {isSupported
                ? 'Instant over-the-air updates'
                : 'Enabled in release builds'}
            </Text>
          </View>
          <Button
            title="Check for updates"
            pendingTitle="Checking…"
            isPending={isChecking}
            variant="outline"
            size="sm"
            onPress={() => void checkForUpdates(true)}
          />
        </View>
      )}
      <AppUpdateModal
        prompt={updatePrompt}
        isDownloading={isDownloading}
        onUpdateNow={() => void downloadAndApplyUpdate()}
        onDismiss={dismissUpdatePrompt}
      />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    compactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    textColumn: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    updateAvailableBox: {
      gap: spacing.sm,
    },
    updateAvailableText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.primary,
    },
    mutedText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
  })
}
