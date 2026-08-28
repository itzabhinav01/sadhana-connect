import { useMemo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface ButtonProps {
  onPress: () => void
  title: string
  pendingTitle?: string
  isPending?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline'
  // Overrides the accessible name when the visible title alone would be
  // ambiguous — e.g. several quick-amount buttons on the same screen
  // sharing the same number.
  accessibilityLabel?: string
}

export function Button({
  onPress,
  title,
  pendingTitle,
  isPending = false,
  disabled = false,
  variant = 'primary',
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isOutline = variant === 'outline'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isPending}
      accessibilityRole="button"
      accessibilityLabel={
        isPending && pendingTitle ? pendingTitle : (accessibilityLabel ?? title)
      }
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.outline : styles.primary,
        (disabled || isPending) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {isPending ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.primaryForeground} />
      ) : (
        <Text style={isOutline ? styles.outlineText : styles.primaryText}>
          {isPending && pendingTitle ? pendingTitle : title}
        </Text>
      )}
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      borderRadius: 8,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabled: {
      opacity: 0.6,
    },
    pressed: {
      opacity: 0.85,
    },
    primaryText: {
      color: colors.primaryForeground,
      fontSize: fontSize.base,
      fontWeight: '600',
    },
    outlineText: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontWeight: '600',
    },
  })
}
