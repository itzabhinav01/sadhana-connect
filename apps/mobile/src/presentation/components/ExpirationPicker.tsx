import {
  ANNOUNCEMENT_EXPIRATION_PRESETS,
  ANNOUNCEMENT_EXPIRATION_PRESET_LABELS,
  type AnnouncementExpirationPreset,
} from '@sadhana-connect/announcements'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing, fontFamily, radius } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

function tomorrow() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date
}

interface ExpirationPickerProps {
  preset: AnnouncementExpirationPreset
  customDateIso: string | null
  onPresetChange: (preset: AnnouncementExpirationPreset) => void
  onCustomDateChange: (dateIso: string) => void
  error?: string | null
}

export function ExpirationPicker({
  preset,
  customDateIso,
  onPresetChange,
  onCustomDateChange,
  error,
}: ExpirationPickerProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setIsPickerOpen(Platform.OS === 'ios')
    if (event.type === 'set' && selectedDate) {
      onCustomDateChange(selectedDate.toISOString())
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Expiration</Text>
        <Text style={styles.helperText}>Auto-archives after:</Text>
      </View>
      <View style={styles.presetRow}>
        {ANNOUNCEMENT_EXPIRATION_PRESETS.map((option) => {
          const isSelected = preset === option
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={ANNOUNCEMENT_EXPIRATION_PRESET_LABELS[option]}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onPresetChange(option)}
              style={({ pressed }) => [
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={isSelected ? styles.chipTextSelected : styles.chipTextUnselected}>
                {ANNOUNCEMENT_EXPIRATION_PRESET_LABELS[option]}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {preset === 'custom' ? (
        <Pressable
          onPress={() => setIsPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Expiration date"
          style={styles.dateInput}
        >
          <Text style={styles.dateText}>
            📅 {customDateIso ? customDateIso.slice(0, 10) : 'Tap to select expiration date'}
          </Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isPickerOpen ? (
        <DateTimePicker
          value={customDateIso ? new Date(customDateIso) : tomorrow()}
          mode="date"
          display="default"
          minimumDate={tomorrow()}
          onChange={handleChange}
        />
      ) : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    helperText: {
      fontSize: fontSize.xs,
      color: colors.muted,
      fontFamily: fontFamily.regular,
    },
    presetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs + 2,
    },
    chip: {
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: 7,
      borderRadius: radius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipUnselected: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.primary + '22',
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    chipPressed: {
      opacity: 0.7,
    },
    chipTextUnselected: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      color: colors.muted,
    },
    chipTextSelected: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.primary,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.xs,
    },
    dateText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
      fontFamily: fontFamily.regular,
    },
  })
}
