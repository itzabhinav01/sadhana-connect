import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@sadhana-connect/auth'
import {
  DEFAULT_DAILY_REMINDER_SETTINGS,
  dailySadhanaReminderStorage,
} from '../../infrastructure/local-storage/daily-sadhana-reminder-storage'
import { dailySadhanaNotificationService } from '../../infrastructure/notifications/daily-sadhana-notification-service'

export function useDailySadhanaReminder() {
  const { session } = useAuth()
  const userId = session?.userId ?? null

  const [isLoading, setIsLoading] = useState(true)
  const [enabled, setEnabled] = useState(DEFAULT_DAILY_REMINDER_SETTINGS.enabled)
  const [reminderTime, setReminderTime] = useState(DEFAULT_DAILY_REMINDER_SETTINGS.reminderTime)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Load saved settings on mount or user change
  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!userId) {
        setIsLoading(false)
        return
      }
      try {
        const settings = await dailySadhanaReminderStorage.getSettings(userId)
        if (isMounted) {
          setEnabled(settings.enabled)
          setReminderTime(settings.reminderTime)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [userId])

  const toggleReminder = useCallback(
    async (newEnabled: boolean): Promise<boolean> => {
      if (!userId) return false
      setPermissionDenied(false)

      if (newEnabled) {
        const scheduled = await dailySadhanaNotificationService.scheduleDailyReminder(reminderTime)
        if (!scheduled) {
          setPermissionDenied(true)
          return false
        }
      } else {
        await dailySadhanaNotificationService.cancelDailyReminder()
      }

      setEnabled(newEnabled)
      await dailySadhanaReminderStorage.setSettings(userId, {
        enabled: newEnabled,
        reminderTime,
      })
      return true
    },
    [userId, reminderTime],
  )

  const changeReminderTime = useCallback(
    async (newTime: string): Promise<boolean> => {
      if (!userId) return false
      setPermissionDenied(false)
      setReminderTime(newTime)

      if (enabled) {
        const scheduled = await dailySadhanaNotificationService.scheduleDailyReminder(newTime)
        if (!scheduled) {
          setPermissionDenied(true)
          return false
        }
      }

      await dailySadhanaReminderStorage.setSettings(userId, {
        enabled,
        reminderTime: newTime,
      })
      return true
    },
    [userId, enabled],
  )

  return {
    isLoading,
    enabled,
    reminderTime,
    permissionDenied,
    toggleReminder,
    changeReminderTime,
  }
}
