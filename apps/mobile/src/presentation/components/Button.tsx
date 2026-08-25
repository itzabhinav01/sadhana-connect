import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

interface ButtonProps {
  onPress: () => void
  title: string
  pendingTitle?: string
  isPending?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline'
}

export function Button({
  onPress,
  title,
  pendingTitle,
  isPending = false,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const isOutline = variant === 'outline'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isPending}
      accessibilityRole="button"
      accessibilityLabel={isPending && pendingTitle ? pendingTitle : title}
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

const styles = StyleSheet.create({
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
