import * as Clipboard from 'expo-clipboard'
import {
  AUTHOR_NAME,
  formatVerseCitation,
  formatVerseCitationForCopy,
  useVerseOfTheDay,
} from '@sadhana-connect/verse'
import { useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '../../../src/presentation/components/Button'
import { ErrorBanner } from '../../../src/presentation/components/ErrorBanner'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { colors, fontSize, spacing } from '../../../src/shared/theme'

const COPIED_FEEDBACK_MS = 2000

export default function VerseOfTheDayScreen() {
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
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Translation</Text>
            <Text style={styles.translationText}>{verse.content.translation}</Text>
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Read on VedaBase"
          variant="outline"
          onPress={() => Linking.openURL(verse.sourceUrl)}
        />
        <Button
          title={isCopied ? 'Copied' : 'Copy Citation'}
          variant="outline"
          onPress={handleCopy}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
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
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.foreground,
  },
  mutedLine: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  block: {
    gap: spacing.xs,
  },
  blockLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
  },
  sanskritText: {
    fontSize: fontSize.base,
    fontStyle: 'italic',
    color: colors.foreground,
  },
  translationText: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    color: colors.foreground,
  },
  actions: {
    gap: spacing.sm,
  },
})
