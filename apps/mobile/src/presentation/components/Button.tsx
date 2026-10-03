import { useMemo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, radius, spacing, fontFamily, touchTarget } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

type ButtonVariant = 'primary' | 'outline' | 'text' | 'destructive'
type ButtonSize = 'default' | 'sm'

interface ButtonProps {
  onPress: () => void
  title: string
  pendingTitle?: string
  isPending?: boolean
  disabled?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
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
  size = 'default',
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const containerStyle = {
    primary: styles.primary,
    outline: styles.outline,
    text: styles.text,
    destructive: styles.destructive,
  }[variant]

  const textStyle = {
    primary: styles.primaryText,
    outline: styles.outlineText,
    text: styles.textVariantText,
    destructive: styles.destructiveText,
  }[variant]

  const spinnerColor = variant === 'primary' || variant === 'destructive'
    ? colors.primaryForeground
    : colors.primary

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isPending}
      accessibilityRole="button"
      accessibilityLabel={
        isPending && pendingTitle ? pendingTitle : (accessibilityLabel ?? title)
      }
      hitSlop={variant === 'text' || size === 'sm' ? spacing.xs : undefined}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        variant === 'text' && styles.buttonText,
        containerStyle,
        (disabled || isPending) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {isPending ? (
        <ActivityIndicator color={spinnerColor} size={size === 'sm' ? 'small' : undefined} />
      ) : (
        <Text style={[textStyle, size === 'sm' && styles.textSm]}>
          {isPending && pendingTitle ? pendingTitle : title}
        </Text>
      )}
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      borderRadius: radius.lg,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: touchTarget,
    },
    buttonSm: {
      borderRadius: radius.full,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm + 4,
      minHeight: 34,
    },
    textSm: {
      fontSize: fontSize.sm,
    },
    // The "text" variant is intentionally low-chrome (no border, tighter
    // padding) — it still meets touchTarget via hitSlop rather than
    // visible padding, so it doesn't look like a full button.
    buttonText: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      minHeight: undefined,
      alignSelf: 'flex-start',
    },
    primary: {
      backgroundColor: colors.primary,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    outline: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    text: {
      backgroundColor: 'transparent',
    },
    destructive: {
      backgroundColor: colors.destructive,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
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
      fontFamily: fontFamily.semiBold,
    },
    outlineText: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
    },
    textVariantText: {
      color: colors.primary,
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
    },
    destructiveText: {
      color: colors.primaryForeground,
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
    },
  })
}
