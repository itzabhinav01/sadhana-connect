import { useMemo } from 'react'
import { Image, Modal, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import type { UpdatePromptState } from '../hooks/use-app-updates'
import { Button } from './Button'
import { Icon } from './Icon'

interface AppUpdateModalProps {
  prompt: UpdatePromptState | null
  isDownloading?: boolean
  onUpdateNow: () => void
  onDismiss: () => void
}

export function AppUpdateModal({
  prompt,
  isDownloading = false,
  onUpdateNow,
  onDismiss,
}: AppUpdateModalProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!prompt) return null

  const isUpdateAvailable = prompt.type === 'update-available'
  const isError = prompt.type === 'error'
  const isUpToDate = prompt.type === 'up-to-date'

  return (
    <Modal
      visible={prompt !== null}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badgeHeader}>
            <View
              style={[
                styles.iconBadge,
                isError ? styles.iconBadgeError : styles.iconBadgePrimary,
              ]}
            >
              {isUpdateAvailable ? (
                <Image
                  source={require('../../../assets/images/icon.png')}
                  style={styles.logoImage}
                />
              ) : (
                <Icon
                  name={
                    isError
                      ? 'alert-circle-outline'
                      : isUpToDate
                        ? 'checkmark-circle-outline'
                        : 'sparkles-outline'
                  }
                  size={24}
                  color={isError ? colors.destructive : colors.primary}
                />
              )}
            </View>
            <View style={styles.titleCol}>
              <Text style={styles.eyebrow}>Sadhana Connect</Text>
              <Text style={styles.title}>{prompt.title}</Text>
            </View>
          </View>

          <Text style={styles.message}>{prompt.message}</Text>

          <View style={styles.actions}>
            {isUpdateAvailable ? (
              <>
                <Button
                  title="Update & Restart Now"
                  pendingTitle="Downloading Update…"
                  isPending={isDownloading}
                  onPress={onUpdateNow}
                />
                <Button
                  title="Later"
                  variant="outline"
                  size="sm"
                  disabled={isDownloading}
                  onPress={onDismiss}
                />
              </>
            ) : (
              <Button
                title="Got It"
                variant="primary"
                size="sm"
                onPress={onDismiss}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 10, 6, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      overflow: 'hidden',
    },
    iconBadgePrimary: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
    },
    iconBadgeError: {
      backgroundColor: colors.destructiveBackground,
      borderColor: colors.destructive,
    },
    logoImage: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
    },
    titleCol: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    title: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
    message: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      lineHeight: 20,
    },
    actions: {
      gap: spacing.xs + 2,
      marginTop: spacing.xs,
    },
  })
}
