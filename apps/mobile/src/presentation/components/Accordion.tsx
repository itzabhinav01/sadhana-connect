import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated'

import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing, sectionAccents, touchTarget } from '../../shared/theme'
import type { SectionAccent } from '../../shared/theme'
import { Icon } from './Icon'

interface AccordionProps {
  title: string
  // Omitted for the neutral "Details" group (Notes/Signature) — a
  // section that isn't one of the five practice categories doesn't get
  // a color identity, just the border/muted treatment.
  accent?: SectionAccent
  expanded: boolean
  onToggle: () => void
  // One-line preview shown next to the chevron while collapsed, e.g.
  // "16 rounds" or "Not logged" — so a closed section stays scannable.
  summary?: string
  children: ReactNode
}

const ANIMATION_MS = 200

export function Accordion({ title, accent, expanded, onToggle, summary, children }: AccordionProps) {
  const { colors } = useTheme()
  const reducedMotion = useReducedMotion()
  const resolvedAccent: SectionAccent = useMemo(
    () => accent ?? { color: colors.muted, soft: colors.mutedBackground },
    [accent, colors.muted, colors.mutedBackground],
  )
  const styles = useMemo(() => createStyles(resolvedAccent), [resolvedAccent])
  const duration = reducedMotion ? 0 : ANIMATION_MS

  return (
    <Animated.View style={styles.container} layout={LinearTransition.duration(duration)}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={!expanded && summary ? `${title}, ${summary}` : title}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {!expanded && summary ? <Text style={styles.summary}>{summary}</Text> : null}
        </View>
        <Icon
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color={resolvedAccent.color}
        />
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(duration)}
          exiting={reducedMotion ? undefined : FadeOut.duration(duration)}
          style={styles.content}
        >
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  )
}

export function useSectionAccent(name: keyof typeof sectionAccents.light): SectionAccent {
  const { resolvedTheme } = useTheme()
  return sectionAccents[resolvedTheme][name]
}

function createStyles(accent: SectionAccent) {
  return StyleSheet.create({
    container: {
      backgroundColor: accent.soft,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: accent.color,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      padding: spacing.md,
      minHeight: touchTarget,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: accent.color,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summary: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: accent.color,
      opacity: 0.8,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
  })
}
