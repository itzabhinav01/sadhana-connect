import { ReminderRateLimitedError, useSendReminder } from '@sadhana-connect/notifications'
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'
import { Button } from './Button'
import { ErrorBanner } from './ErrorBanner'

const REMINDER_MESSAGE_MAX_LENGTH = 500

export function ReminderForm({ devoteeId }: { devoteeId: string }) {
  const [mode, setMode] = useState<'generic' | 'custom'>('generic')
  const [customMessage, setCustomMessage] = useState('')
  const sendReminder = useSendReminder()

  const handleSend = () => {
    sendReminder.mutate({
      devoteeId,
      message: mode === 'custom' ? customMessage : null,
    })
  }

  const isRateLimited = sendReminder.error instanceof ReminderRateLimitedError

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send a reminder</Text>

      <View style={styles.modeRow}>
        <Button
          title="Generic message"
          variant={mode === 'generic' ? 'primary' : 'outline'}
          onPress={() => setMode('generic')}
        />
        <Button
          title="Custom message"
          variant={mode === 'custom' ? 'primary' : 'outline'}
          onPress={() => setMode('custom')}
        />
      </View>

      {mode === 'custom' ? (
        <TextInput
          style={styles.textArea}
          value={customMessage}
          onChangeText={setCustomMessage}
          multiline
          maxLength={REMINDER_MESSAGE_MAX_LENGTH}
          placeholder="Please remember to fill in your Sadhana report."
          accessibilityLabel="Custom reminder message"
        />
      ) : null}

      <Button
        title="Send reminder"
        pendingTitle="Sending…"
        isPending={sendReminder.isPending}
        disabled={mode === 'custom' && customMessage.trim().length === 0}
        onPress={handleSend}
      />

      {sendReminder.isSuccess ? (
        <Text style={styles.successText}>Reminder sent successfully.</Text>
      ) : null}

      {sendReminder.isError ? (
        <ErrorBanner
          message={
            isRateLimited
              ? sendReminder.error.message
              : 'Something went wrong sending this reminder. Please try again.'
          }
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.foreground,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.foreground,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  successText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
})
