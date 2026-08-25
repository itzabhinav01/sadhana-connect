import {
  ANNOUNCEMENT_EXPIRATION_PRESETS,
  ANNOUNCEMENT_EXPIRATION_PRESET_LABELS,
  type AnnouncementExpirationPreset,
} from '@sadhana-connect/announcements'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'
import { Button } from './Button'

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
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setIsPickerOpen(Platform.OS === 'ios')
    if (event.type === 'set' && selectedDate) {
      onCustomDateChange(selectedDate.toISOString())
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Expiration</Text>
      <View style={styles.presetRow}>
        {ANNOUNCEMENT_EXPIRATION_PRESETS.map((option) => (
          <Button
            key={option}
            title={ANNOUNCEMENT_EXPIRATION_PRESET_LABELS[option]}
            variant={preset === option ? 'primary' : 'outline'}
            onPress={() => onPresetChange(option)}
          />
        ))}
      </View>

      {preset === 'custom' ? (
        <Pressable
          onPress={() => setIsPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Expiration date"
          style={styles.dateInput}
        >
          <Text style={styles.dateText}>
            {customDateIso ? customDateIso.slice(0, 10) : 'Select date'}
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.foreground,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.destructive,
  },
})
