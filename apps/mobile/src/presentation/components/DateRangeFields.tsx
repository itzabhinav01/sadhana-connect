import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing, fontFamily } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface DateRangeFieldsProps {
  fromDate: string
  toDate: string
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
}

// Mobile equivalent of web's shared DateRangeInputs — an always-visible
// From/To pair, capped at local today, with each caller owning its own
// quick-filter buttons and blank-value semantics (e.g. History's blank
// fromDate = unbounded), matching that component's own doc comment.
export function DateRangeFields({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateRangeFieldsProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [openPicker, setOpenPicker] = useState<'from' | 'to' | null>(null)
  const today = getLocalDateIso()

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setOpenPicker(Platform.OS === 'ios' ? openPicker : null)
    if (event.type !== 'set' || !selectedDate) return

    const iso = getLocalDateIso(selectedDate)
    if (openPicker === 'from') {
      onFromDateChange(iso)
    } else if (openPicker === 'to') {
      onToDateChange(iso)
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={styles.label}>From</Text>
        <Pressable
          onPress={() => setOpenPicker('from')}
          accessibilityRole="button"
          accessibilityLabel="From date"
          style={styles.dateInput}
        >
          <Text style={styles.dateText}>{fromDate || 'Any'}</Text>
        </Pressable>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>To</Text>
        <Pressable
          onPress={() => setOpenPicker('to')}
          accessibilityRole="button"
          accessibilityLabel="To date"
          style={styles.dateInput}
        >
          <Text style={styles.dateText}>{toDate || 'Today'}</Text>
        </Pressable>
      </View>

      {openPicker ? (
        <DateTimePicker
          value={(openPicker === 'from' ? fromDate : toDate) ? new Date((openPicker === 'from' ? fromDate : toDate) + 'T00:00:00') : new Date()}
          mode="date"
          display="default"
          maximumDate={new Date(today + 'T00:00:00')}
          onChange={handleChange}
        />
      ) : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    field: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
      color: colors.foreground,
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
  })
}
