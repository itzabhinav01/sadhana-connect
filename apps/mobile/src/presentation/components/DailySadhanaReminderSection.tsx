import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { formatTime12Hour } from '@sadhana-connect/shared'
import { useMemo, useState } from 'react'
import { Platform, StyleSheet, Switch, Text, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontFamily, fontSize, radius, spacing } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'
import { Button } from './Button'
import { Card } from './Card'
import { ErrorBanner } from './ErrorBanner'
import { useDailySadhanaReminder } from '../hooks/use-daily-sadhana-reminder'

const PRESET_TIMES = [
  { label: '8:00 PM', value: '20:00' },
  { label: '8:30 PM', value: '20:30' },
  { label: '9:00 PM', value: '21:00' },
  { label: '9:30 PM', value: '21:30' },
  { label: '10:00 PM', value: '22:00' },
]

export function DailySadhanaReminderSection() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const {
    isLoading,
    enabled,
    reminderTime,
    permissionDenied,
    toggleReminder,
    changeReminderTime,
  } = useDailySadhanaReminder()

  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const pickerDate = useMemo(() => {
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const date = new Date()
    date.setHours(hours || 21, minutes || 0, 0, 0)
    return date
  }, [reminderTime])

  function handleTimeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowCustomPicker(false)
    }
    if (event.type === 'dismissed' || !selectedDate) {
      return
    }
    const hours = String(selectedDate.getHours()).padStart(2, '0')
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0')
    changeReminderTime(`${hours}:${minutes}`)
  }

  if (isLoading) {
    return (
      <Card title="Daily Sadhana Reminder">
        <Text style={styles.mutedLine}>Loading reminder settings…</Text>
      </Card>
    )
  }

  return (
    <Card title="Daily Sadhana Reminder">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.reminderTitle}>Daily Notification</Text>
          <Text style={styles.mutedLine}>
            Receive a notification on your phone reminding you to submit today&apos;s Sadhana.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(val) => toggleReminder(val)}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel="Toggle daily sadhana reminder"
        />
      </View>

      {permissionDenied ? (
        <ErrorBanner message="Notification permission is required. Please enable notifications in your phone's Settings." />
      ) : null}

      {enabled ? (
        <View style={styles.timeSection}>
          <Text style={styles.subHeading}>Choose Reminder Time</Text>
          <View style={styles.presetsRow}>
            {PRESET_TIMES.map((preset) => {
              const isSelected = reminderTime === preset.value
              return (
                <Button
                  key={preset.value}
                  title={preset.label}
                  variant={isSelected ? 'primary' : 'outline'}
                  onPress={() => changeReminderTime(preset.value)}
                />
              )
            })}
            <Button
              title="Custom Time…"
              variant="outline"
              onPress={() => setShowCustomPicker(true)}
            />
          </View>

          {showCustomPicker ? (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
              {Platform.OS === 'ios' ? (
                <Button
                  title="Done"
                  variant="outline"
                  onPress={() => setShowCustomPicker(false)}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              🔔 Scheduled: You will receive a daily notification at{' '}
              <Text style={styles.boldText}>{formatTime12Hour(reminderTime)}</Text>.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.statusBox}>
          <Text style={styles.statusMutedText}>
            🔕 Daily reminder is currently disabled. Turn on the switch above to set a time.
          </Text>
        </View>
      )}
    </Card>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerLeft: {
      flex: 1,
      gap: spacing.xs,
    },
    reminderTitle: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.foreground,
    },
    mutedLine: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
      lineHeight: 18,
    },
    timeSection: {
      gap: spacing.sm,
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    subHeading: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.semiBold,
      fontWeight: '600',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    pickerContainer: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    statusBox: {
      backgroundColor: colors.muted + '18',
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: spacing.xs,
    },
    statusText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    statusMutedText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.muted,
    },
    boldText: {
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      color: colors.foreground,
    },
  })
}
