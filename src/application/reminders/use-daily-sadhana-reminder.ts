import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@sadhana-connect/auth'

const STORAGE_PREFIX = 'sadhana-connect:daily-reminder'

export interface DailyReminderSettings {
  enabled: boolean
  reminderTime: string // "HH:mm"
}

export const DEFAULT_REMINDER_SETTINGS: DailyReminderSettings = {
  enabled: false,
  reminderTime: '21:00', // 9:00 PM default
}

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

export function useDailySadhanaReminder() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  const [isLoading, setIsLoading] = useState(true)
  const [enabled, setEnabled] = useState(DEFAULT_REMINDER_SETTINGS.enabled)
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_SETTINGS.reminderTime)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  // Check browser notification support and load stored settings
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }

    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      const raw = localStorage.getItem(getStorageKey(userId))
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DailyReminderSettings>
        if (typeof parsed.enabled === 'boolean') setEnabled(parsed.enabled)
        if (typeof parsed.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.reminderTime)) {
          setReminderTime(parsed.reminderTime)
        }
      }
    } catch {
      // Ignore localStorage read errors
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }
    if (Notification.permission === 'granted') {
      setPermission('granted')
      return true
    }
    try {
      const res = await Notification.requestPermission()
      setPermission(res)
      return res === 'granted'
    } catch {
      return false
    }
  }, [])

  const toggleReminder = useCallback(
    async (newEnabled: boolean): Promise<boolean> => {
      if (!userId) return false

      if (newEnabled) {
        const granted = await requestBrowserPermission()
        if (!granted && Notification.permission === 'denied') {
          return false
        }
      }

      setEnabled(newEnabled)
      try {
        localStorage.setItem(
          getStorageKey(userId),
          JSON.stringify({ enabled: newEnabled, reminderTime }),
        )
      } catch {
        // Ignore
      }
      return true
    },
    [userId, reminderTime, requestBrowserPermission],
  )

  const changeReminderTime = useCallback(
    async (newTime: string): Promise<boolean> => {
      if (!userId) return false
      setReminderTime(newTime)

      try {
        localStorage.setItem(
          getStorageKey(userId),
          JSON.stringify({ enabled, reminderTime: newTime }),
        )
      } catch {
        // Ignore
      }
      return true
    },
    [userId, enabled],
  )

  const sendTestNotification = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Daily Sadhana Reminder 🙏', {
        body: "Please remember to fill today's Sadhana report.",
        icon: '/favicon.ico',
      })
      return true
    }
    return false
  }, [])

  return {
    isLoading,
    enabled,
    reminderTime,
    permission,
    isSupported,
    toggleReminder,
    changeReminderTime,
    requestBrowserPermission,
    sendTestNotification,
  }
}
