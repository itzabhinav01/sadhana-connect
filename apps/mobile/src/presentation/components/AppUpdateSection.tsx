import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { useAppUpdates } from '../hooks/use-app-updates'
import { Button } from './Button'
import { Card } from './Card'

export function AppUpdateSection() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const {
    isSupported,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    checkForUpdates,
    downloadAndApplyUpdate,
  } = useAppUpdates({ promptUserOnUpdate: false })

  return (
    <Card title="App Updates">
      <Text style={styles.description}>
        Get the latest improvements and fixes instantly without reinstalling.
      </Text>

      {isUpdateAvailable ? (
        <View style={styles.updateAvailableBox}>
          <Text style={styles.updateAvailableText}>A new update is available!</Text>
          <Button
            title="Update & Restart Now"
            pendingTitle="Updating…"
            isPending={isDownloading}
            onPress={() => void downloadAndApplyUpdate()}
          />
        </View>
      ) : (
        <Button
          title="Check for updates"
          pendingTitle="Checking…"
          isPending={isChecking}
          variant="outline"
          onPress={() => void checkForUpdates(true)}
        />
      )}

      {!isSupported ? (
        <Text style={styles.mutedText}>
          Over-the-air updates are enabled in release builds.
        </Text>
      ) : null}
    </Card>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    description: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      marginBottom: spacing.xs,
    },
    updateAvailableBox: {
      gap: spacing.sm,
    },
    updateAvailableText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.primary,
    },
    mutedText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      marginTop: spacing.xs,
    },
  })
}
