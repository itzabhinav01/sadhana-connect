import * as Clipboard from 'expo-clipboard'
import {
  AUTHOR_NAME,
  formatVerseCitation,
  formatVerseCitationForCopy,
  useVerseOfTheDay,
} from '@sadhana-connect/verse'
import { useMemo, useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { Button } from '../../../src/presentation/components/Button'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { fontFamily, fontSize, radius, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

const COPIED_FEEDBACK_MS = 2000

export default function VerseOfTheDayScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const verseQuery = useVerseOfTheDay()
  const [isCopied, setIsCopied] = useState(false)

  if (verseQuery.isPending) {
    return <LoadingScreen />
  }

  if (verseQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message="Something went wrong loading today's verse. Please try again." />
      </View>
    )
  }

  if (verseQuery.isSuccess && verseQuery.data === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedLine}>Today&apos;s verse is not available yet.</Text>
      </View>
    )
  }

  const verse = verseQuery.data!

  const handleCopy = async () => {
    await Clipboard.setStringAsync(formatVerseCitationForCopy(verse))
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS)
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.heading} accessibilityRole="header">
          {formatVerseCitation(verse)}
        </Text>
        <Text style={styles.mutedLine}>{AUTHOR_NAME}</Text>

        {verse.content ? (
          <>
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Sanskrit</Text>
              <Text style={styles.sanskritText}>{verse.content.sanskritTransliteration}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Translation</Text>
              <Text style={styles.translationText}>{verse.content.translation}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          title="Read on VedaBase"
          variant="text"
          onPress={() => Linking.openURL(verse.sourceUrl)}
        />
        <Button
          title={isCopied ? 'Copied' : 'Copy Citation'}
          variant="text"
          onPress={handleCopy}
        />
      </View>
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    heading: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    block: {
      gap: spacing.xs,
    },
    blockLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sanskritText: {
      fontSize: fontSize.lg,
      fontStyle: 'italic',
      fontFamily: fontFamily.medium,
      lineHeight: fontSize.lg * 1.4,
      color: colors.foreground,
    },
    translationText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      lineHeight: fontSize.base * 1.6,
      color: colors.foreground,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
  })
}
