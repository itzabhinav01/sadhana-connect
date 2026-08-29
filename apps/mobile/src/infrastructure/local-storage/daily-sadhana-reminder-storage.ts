import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_PREFIX = 'sadhana-connect:daily-reminder'

export interface DailySadhanaReminderSettings {
  enabled: boolean
  reminderTime: string // Format: "HH:mm" (24-hour)
}

export const DEFAULT_DAILY_REMINDER_SETTINGS: DailySadhanaReminderSettings = {
  enabled: false,
  reminderTime: '21:00', // Default: 9:00 PM
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

export const dailySadhanaReminderStorage = {
  async getSettings(userId: string): Promise<DailySadhanaReminderSettings> {
    const raw = await AsyncStorage.getItem(storageKey(userId))
    if (raw === null) return DEFAULT_DAILY_REMINDER_SETTINGS

    try {
      const parsed = JSON.parse(raw) as Partial<DailySadhanaReminderSettings>
      const enabled = typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_DAILY_REMINDER_SETTINGS.enabled
      const reminderTime =
        typeof parsed.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.reminderTime)
          ? parsed.reminderTime
          : DEFAULT_DAILY_REMINDER_SETTINGS.reminderTime

      return { enabled, reminderTime }
    } catch {
      return DEFAULT_DAILY_REMINDER_SETTINGS
    }
  },

  async setSettings(userId: string, settings: DailySadhanaReminderSettings): Promise<void> {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(settings))
  },
}
