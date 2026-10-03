import { getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { isRunningInExpoGo } from 'expo'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

export const DAILY_SADHANA_REMINDER_NOTIFICATION_ID = 'daily-sadhana-reminder'
export const SADHANA_REMINDER_CHANNEL_ID = 'sadhana-reminders'
export const SADHANA_ALERTS_CHANNEL_ID = 'sadhana-alerts'

const DEFAULT_EAS_PROJECT_ID = '38e0f4dd-9010-467d-acb7-0d2159338b00'
const presentedNotificationIds = new Set<string>()

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
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
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

  async ensureAlertsChannel(): Promise<void> {
    const Notifications = getNotificationsModule()
    if (!Notifications || Platform.OS !== 'android') return

    try {
      await Notifications.setNotificationChannelAsync(SADHANA_ALERTS_CHANNEL_ID, {
        name: 'Announcements & Mentor Alerts',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      })
    } catch {
      // Ignore
    }
  },

  async registerPushTokenAsync(): Promise<string | null> {
    const Notifications = getNotificationsModule()
    if (!Notifications) return null

    try {
      await this.ensureAlertsChannel()
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) return null

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId ??
        DEFAULT_EAS_PROJECT_ID

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId })
      const expoPushToken = tokenResponse?.data
      if (!expoPushToken) return null

      await getSupabaseClient().rpc('register_push_token', {
        p_expo_push_token: expoPushToken,
        p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
      })

      return expoPushToken
    } catch {
      return null
    }
  },

  async presentAlertNotification(params: {
    id: string
    title: string
    body: string | null
    url: string
  }): Promise<void> {
    const Notifications = getNotificationsModule()
    if (!Notifications) return
    if (presentedNotificationIds.has(params.id)) return
    presentedNotificationIds.add(params.id)

    try {
      await this.ensureAlertsChannel()
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) return

      await Notifications.scheduleNotificationAsync({
        identifier: params.id,
        content: {
          title: params.title,
          body: params.body ?? '',
          data: { url: params.url, notificationId: params.id },
          sound: true,
        },
        trigger:
          Platform.OS === 'android'
            ? { channelId: SADHANA_ALERTS_CHANNEL_ID }
            : null,
      })
    } catch {
      // Ignore
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
