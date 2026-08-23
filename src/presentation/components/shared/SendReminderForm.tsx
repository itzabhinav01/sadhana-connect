import { useState } from 'react'

import { ReminderRateLimitedError, useSendReminder } from '@/application/notifications/use-send-reminder'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'

const REMINDER_MESSAGE_MAX_LENGTH = 500

interface SendReminderFormProps {
  devoteeId: string
}

// Manual reminder (Phase 20B) — a mentor may only target their own
// currently-assigned devotee, a super_admin any devotee; both that
// authorization and the 2-per-24h rate limit are enforced entirely
// inside public.send_reminder_notification() (0012), not by this
// component. The success Alert mirrors SadhanaReportForm's own
// isSuccess-Alert pattern (this codebase's established idiom for
// mutation feedback — no toast library exists or is warranted here) so
// the sender gets clear confirmation and isn't tempted to click
// repeatedly "just in case."
export function SendReminderForm({ devoteeId }: SendReminderFormProps) {
  const [mode, setMode] = useState<'generic' | 'custom'>('generic')
  const [customMessage, setCustomMessage] = useState('')
  const sendReminder = useSendReminder()

  function handleSend() {
    sendReminder.mutate({
      devoteeId,
      message: mode === 'custom' ? customMessage : null,
    })
  }

  const isRateLimited = sendReminder.error instanceof ReminderRateLimitedError

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">Send a reminder</span>

      <div className="flex items-center gap-4 text-sm text-foreground">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`reminder-mode-${devoteeId}`}
            checked={mode === 'generic'}
            onChange={() => setMode('generic')}
          />
          Generic message
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`reminder-mode-${devoteeId}`}
            checked={mode === 'custom'}
            onChange={() => setMode('custom')}
          />
          Custom message
        </label>
      </div>

      {mode === 'custom' ? (
        <Textarea
          rows={3}
          maxLength={REMINDER_MESSAGE_MAX_LENGTH}
          aria-label="Custom reminder message"
          placeholder="Please remember to fill in your Sadhana report."
          value={customMessage}
          onChange={(event) => setCustomMessage(event.target.value)}
        />
      ) : null}

      <Button
        type="button"
        size="sm"
        className="self-start"
        onClick={handleSend}
        disabled={sendReminder.isPending || (mode === 'custom' && customMessage.trim().length === 0)}
      >
        {sendReminder.isPending ? 'Sending…' : 'Send reminder'}
      </Button>

      {sendReminder.isSuccess ? (
        <Alert>
          <AlertDescription>Reminder sent successfully.</AlertDescription>
        </Alert>
      ) : null}

      {sendReminder.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {isRateLimited
              ? sendReminder.error.message
              : 'Something went wrong sending this reminder. Please try again.'}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
