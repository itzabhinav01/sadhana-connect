import { useMemo } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing, fontFamily, touchTarget } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { Button } from './Button'

interface NumberFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  // A stepper is only offered for fields the devotee taps repeatedly
  // through the day (round counts) — not e.g. reading minutes, where a
  // single quick-amount tap already covers the common case.
  showStepper?: boolean
  quickAmounts?: number[]
  allowDecimal?: boolean
}

export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  showStepper = false,
  quickAmounts,
  allowDecimal = false,
}: NumberFieldProps<T>) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
        const numericValue = Number(value) || 0

        return (
          <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputRow}>
              {showStepper ? (
                <Pressable
                  onPress={() => onChange(String(Math.max(0, numericValue - 1)))}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${label}`}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </Pressable>
              ) : null}
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                onChangeText={(text) => onChange(allowDecimal ? text.replace(',', '.') : text)}
                onBlur={onBlur}
                value={value as string | undefined}
                placeholder={allowDecimal ? '0 (e.g. 2.5)' : '0'}
                keyboardType={allowDecimal ? 'decimal-pad' : 'numeric'}
                accessibilityLabel={label}
                placeholderTextColor={colors.placeholder ?? colors.muted}
              />
              {showStepper ? (
                <Pressable
                  onPress={() => onChange(String(numericValue + 1))}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${label}`}
                  style={styles.stepperButton}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </Pressable>
              ) : null}
            </View>
            {quickAmounts ? (
              <View style={styles.presetRow}>
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    title={String(amount)}
                    accessibilityLabel={`Set ${label} to ${amount}`}
                    variant={numericValue === amount ? 'primary' : 'outline'}
                    onPress={() => onChange(String(amount))}
                  />
                ))}
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        )
      }}
    />
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      minHeight: touchTarget,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    stepperButton: {
      width: touchTarget,
      height: touchTarget,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperButtonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    presetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
  })
}
