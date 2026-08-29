import { isRunningInExpoGo } from 'expo'
import { Platform } from 'react-native'

export const DAILY_SADHANA_REMINDER_NOTIFICATION_ID = 'daily-sadhana-reminder'
export const SADHANA_REMINDER_CHANNEL_ID = 'sadhana-reminders'

// In Expo SDK 53+, expo-notifications throws at import time in Expo Go on Android.
// We dynamically load the module only when running outside of Expo Go on Android or on supported platforms.
function getNotificationsModule(): typeof import('expo-notifications') | null {
  if (isRunningInExpoGo() && Platform.OS === 'android') {
    return null
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications')
  } catch {
    return null
  }
}

export const dailySadhanaNotificationService = {
  isSupported(): boolean {
    return !(isRunningInExpoGo() && Platform.OS === 'android')
  },

  initHandler(): void {
    const Notifications = getNotificationsModule()
    if (!Notifications) return

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      })
    } catch {
      // Ignore
    }
  },

  subscribeNotificationResponse(onUrl: (url: string) => void): () => void {
    const Notifications = getNotificationsModule()
    if (!Notifications) return () => {}

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url
        if (typeof url === 'string') {
          onUrl(url)
        }
      })
      return () => subscription.remove()
    } catch {
      return () => {}
    }
  },

  async requestPermissions(): Promise<boolean> {
    const Notifications = getNotificationsModule()
    if (!Notifications) {
      // In Expo Go on Android, return true so settings can still be configured and stored
      return true
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      return finalStatus === 'granted'
    } catch {
      return true
    }
  },

  async scheduleDailyReminder(time: string): Promise<boolean> {
    const Notifications = getNotificationsModule()
    if (!Notifications) {
      // In Expo Go on Android, saved in local storage without crashing
      return true
    }

    const hasPermission = await this.requestPermissions()
    if (!hasPermission) return false

    const [hourStr, minuteStr] = time.split(':')
    const hour = parseInt(hourStr ?? '21', 10)
    const minute = parseInt(minuteStr ?? '0', 10)

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(SADHANA_REMINDER_CHANNEL_ID, {
          name: 'Sadhana Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        })
      }

      await Notifications.cancelScheduledNotificationAsync(DAILY_SADHANA_REMINDER_NOTIFICATION_ID)

      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_SADHANA_REMINDER_NOTIFICATION_ID,
        content: {
          title: 'Daily Sadhana Reminder 🙏',
          body: "Please remember to fill today's Sadhana report.",
          data: { url: '/devotee/sadhana' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: SADHANA_REMINDER_CHANNEL_ID,
        },
      })
    } catch {
      // Ignore
    }

    return true
  },

  async cancelDailyReminder(): Promise<void> {
    const Notifications = getNotificationsModule()
    if (!Notifications) return

    try {
      await Notifications.cancelScheduledNotificationAsync(DAILY_SADHANA_REMINDER_NOTIFICATION_ID)
    } catch {
      // Ignore
    }
  },
}
