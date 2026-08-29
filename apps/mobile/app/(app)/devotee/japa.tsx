import { BEADS_PER_ROUND } from '@sadhana-connect/japa'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../../src/application/theme/use-theme'
import { useJapaCounter } from '../../../src/application/japa/use-japa-counter'
import { Button } from '../../../src/presentation/components/Button'
import { LoadingScreen } from '../../../src/presentation/components/LoadingScreen'
import { fontFamily, fontSize, spacing } from '../../../src/shared/theme'
import type { ThemeColors } from '../../../src/shared/theme'

export default function JapaCounterScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const japa = useJapaCounter()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [targetInput, setTargetInput] = useState(String(japa.targetRounds))

  // Adjusts state during render when targetRounds changes externally
  // (e.g. finished loading from AsyncStorage) — same pattern web uses
  // for cross-tab sync, here it's for the initial async load instead.
  const [syncedTarget, setSyncedTarget] = useState(japa.targetRounds)
  if (japa.targetRounds !== syncedTarget) {
    setSyncedTarget(japa.targetRounds)
    setTargetInput(String(japa.targetRounds))
  }

  if (!japa.isLoaded) {
    return <LoadingScreen />
  }

  const handleTargetChange = (value: string) => {
    setTargetInput(value)
    const parsed = Number(value)
    if (value !== '' && Number.isInteger(parsed) && parsed > 0) {
      japa.setTarget(parsed)
    }
  }

  const handleTargetBlur = () => {
    const parsed = Number(targetInput)
    const isValid = targetInput !== '' && Number.isInteger(parsed) && parsed > 0
    if (!isValid) {
      setTargetInput(String(japa.targetRounds))
    }
  }

  const handleReset = () => {
    japa.reset()
    setConfirmingReset(false)
  }

  // Navigates to the existing Sadhana form with the count pre-filled —
  // never writes to Supabase directly. The devotee still explicitly
  // reviews and signs before anything is saved.
  const handleUseInSadhana = () => {
    router.push({
      pathname: '/devotee/sadhana',
      params: { date: getLocalDateIso(), prefillRounds: String(japa.completedRounds) },
    })
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Japa Counter</Text>
      <Text style={styles.mutedLine}>Tap to count each mantra. 108 beads make one round.</Text>

      <View style={styles.progressBlock}>
        <Text style={styles.mutedLine}>Round {japa.currentRound}</Text>
        <Text style={styles.progressText}>
          {japa.completedRounds} of {japa.targetRounds} rounds today
          {japa.targetReached ? ' — target reached' : ''}
        </Text>
      </View>

      <Pressable
        onPress={japa.tap}
        accessibilityRole="button"
        accessibilityLabel={`Tap to count. Round ${japa.currentRound}, bead ${japa.currentBead} of ${BEADS_PER_ROUND}.`}
        style={({ pressed }) => [styles.tapButton, pressed && styles.tapButtonPressed]}
      >
        <Text style={styles.tapButtonCount}>{japa.currentBead}</Text>
        <Text style={styles.tapButtonLabel}>of {BEADS_PER_ROUND}</Text>
      </Pressable>

      {japa.completedRounds > 0 ? (
        <Button
          title="Use today's completed rounds in Sadhana"
          variant="outline"
          onPress={handleUseInSadhana}
        />
      ) : null}

      <View style={styles.controlsRow}>
        <Button
          title="Undo"
          variant="outline"
          disabled={japa.totalTapsToday === 0}
          onPress={japa.undo}
        />

        {confirmingReset ? (
          <>
            <Text style={styles.mutedLine}>Reset today&apos;s count?</Text>
            <Button title="Confirm" variant="destructive" onPress={handleReset} />
            <Button title="Cancel" variant="text" onPress={() => setConfirmingReset(false)} />
          </>
        ) : (
          <Button title="Reset" variant="outline" onPress={() => setConfirmingReset(true)} />
        )}
      </View>

      <View style={styles.targetRow}>
        <Text style={styles.label}>Daily target (rounds)</Text>
        <TextInput
          style={styles.targetInput}
          value={targetInput}
          onChangeText={handleTargetChange}
          onBlur={handleTargetBlur}
          keyboardType="numeric"
          placeholderTextColor={colors.placeholder ?? colors.muted}
          accessibilityLabel="Daily target (rounds)"
        />
      </View>
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.lg,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    heading: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      alignSelf: 'flex-start',
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    progressBlock: {
      alignItems: 'center',
      gap: 2,
    },
    progressText: {
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    tapButton: {
      width: 224,
      height: 224,
      borderRadius: 112,
      borderWidth: 4,
      borderColor: colors.primary,
      backgroundColor: colors.mutedBackground,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    tapButtonPressed: {
      opacity: 0.85,
    },
    tapButtonCount: {
      fontSize: 48,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    tapButtonLabel: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    controlsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    targetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    targetInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      width: 80,
      textAlign: 'center',
    },
  })
}
