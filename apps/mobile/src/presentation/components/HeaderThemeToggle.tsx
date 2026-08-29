import { useMemo } from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { Icon } from './Icon'
import { radius } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

export function HeaderThemeToggle() {
  const { resolvedTheme, setTheme, colors } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      style={styles.toggleButton}
      onPress={() => setTheme(isDark ? 'light' : 'dark')}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={20}
        color={colors.foreground}
      />
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    toggleButton: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
