import { Bell, BellOff, Clock, Check, AlertCircle } from 'lucide-react'
import { formatTime12Hour } from '@sadhana-connect/shared'

import { useDailySadhanaReminder } from '@/application/reminders/use-daily-sadhana-reminder'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'

const PRESET_TIMES = [
  { label: '8:00 PM', value: '20:00' },
  { label: '8:30 PM', value: '20:30' },
  { label: '9:00 PM', value: '21:00' },
  { label: '9:30 PM', value: '21:30' },
  { label: '10:00 PM', value: '22:00' },
]

export function DailySadhanaReminderCard() {
  const {
    isLoading,
    enabled,
    reminderTime,
    permission,
    isSupported,
    toggleReminder,
    changeReminderTime,
    sendTestNotification,
  } = useDailySadhanaReminder()

  if (isLoading) {
    return null
  }

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {enabled ? (
                <Bell className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Daily Sadhana Reminder</CardTitle>
              <CardDescription>
                Get a reminder notification to fill today&apos;s Sadhana at your preferred time.
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant={enabled ? 'default' : 'outline'}
            onClick={() => toggleReminder(!enabled)}
            className="shrink-0"
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isSupported && permission === 'denied' && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Browser notifications are blocked in your browser settings. Please allow notifications for this site to receive desktop alerts.
            </AlertDescription>
          </Alert>
        )}

        {enabled ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Choose Reminder Time</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PRESET_TIMES.map((preset) => {
                const isSelected = reminderTime === preset.value
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => changeReminderTime(preset.value)}
                    className="h-8 text-xs"
                  >
                    {isSelected && <Check className="mr-1 h-3.5 w-3.5" />}
                    {preset.label}
                  </Button>
                )
              })}

              <div className="flex items-center gap-1.5 pl-1">
                <span className="text-xs text-muted-foreground">Custom:</span>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => changeReminderTime(e.target.value)}
                  className="h-8 w-28 text-xs"
                  aria-label="Custom reminder time"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-foreground">
              <span>
                🔔 Scheduled daily at <strong className="font-semibold">{formatTime12Hour(reminderTime)}</strong>.
              </span>
              {isSupported && permission === 'granted' && (
                <button
                  type="button"
                  onClick={sendTestNotification}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Send test notification
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Turn on the switch above to set a daily reminder time for logging your sadhana.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
