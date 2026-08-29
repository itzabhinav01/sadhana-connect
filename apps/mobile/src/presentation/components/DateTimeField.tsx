import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { formatTime12Hour, getLocalDateIso } from '@sadhana-connect/shared'
import { useMemo, useState } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing, fontFamily } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface DateTimeFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  mode: 'date' | 'time'
  // Date is always required (defaults to today); time fields are
  // optional and clearable, matching web's optional time inputs.
  clearable?: boolean
}

function parseStoredValue(value: string | undefined, mode: 'date' | 'time'): Date {
  if (!value) return new Date()

  if (mode === 'date') {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

function formatToStoredValue(date: Date, mode: 'date' | 'time'): string {
  if (mode === 'date') return getLocalDateIso(date)

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function displayValue(value: string | undefined, mode: 'date' | 'time'): string {
  if (!value) return mode === 'date' ? 'Select date' : 'Not set'
  return mode === 'date' ? value : formatTime12Hour(value)
}

export function DateTimeField<T extends FieldValues>({
  control,
  name,
  label,
  mode,
  clearable = false,
}: DateTimeFieldProps<T>) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const stringValue = value as string | undefined

        const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
          setIsPickerOpen(Platform.OS === 'ios')
          if (event.type === 'set' && selectedDate) {
            onChange(formatToStoredValue(selectedDate, mode))
          }
        }

        return (
          <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => setIsPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={[styles.input, error ? styles.inputError : null]}
              >
                <Text style={styles.valueText}>{displayValue(stringValue, mode)}</Text>
              </Pressable>
              {clearable && stringValue ? (
                <Pressable
                  onPress={() => onChange('')}
                  accessibilityRole="button"
                  accessibilityLabel={`Clear ${label}`}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
            {isPickerOpen ? (
              <DateTimePicker
                value={parseStoredValue(stringValue, mode)}
                mode={mode}
                display="default"
                maximumDate={mode === 'date' ? new Date() : undefined}
                onChange={handleChange}
              />
            ) : null}
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
    row: {
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
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    valueText: {
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    clearButton: {
      paddingHorizontal: spacing.sm,
    },
    clearText: {
      fontSize: fontSize.sm,
      color: colors.link,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
  })
}
