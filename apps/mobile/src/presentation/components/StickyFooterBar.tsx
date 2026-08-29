import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../application/theme/use-theme'
import { spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface StickyFooterBarProps {
  children: ReactNode
}

// Pins its content (typically a single primary Button) to the bottom of
// the screen, above the device's safe-area inset, so a long scrollable
// form's main action stays reachable regardless of scroll position —
// the Sadhana form's save button previously scrolled away with the rest
// of the content.
export function StickyFooterBar({ children }: StickyFooterBarProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {children}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
      elevation: 4,
    },
  })
}
