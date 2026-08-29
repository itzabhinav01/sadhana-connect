import * as Notifications from 'expo-notifications'
import {
  DAILY_SADHANA_REMINDER_NOTIFICATION_ID,
  dailySadhanaNotificationService,
} from './daily-sadhana-notification-service'

jest.mock('expo', () => ({
  isRunningInExpoGo: () => false,
}))

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
  },
  AndroidImportance: {
    HIGH: 4,
  },
}))

describe('dailySadhanaNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' })
    ;(Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('daily-sadhana-reminder')
  })

  it('requests permissions if not granted', async () => {
    ;(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' })
    ;(Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' })

    const hasPermission = await dailySadhanaNotificationService.requestPermissions()

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1)
    expect(hasPermission).toBe(true)
  })

  it('schedules a daily reminder at specified hour and minute', async () => {
    const success = await dailySadhanaNotificationService.scheduleDailyReminder('20:45')

    expect(success).toBe(true)
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      DAILY_SADHANA_REMINDER_NOTIFICATION_ID,
    )
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: DAILY_SADHANA_REMINDER_NOTIFICATION_ID,
        content: expect.objectContaining({
          title: 'Daily Sadhana Reminder 🙏',
        }),
        trigger: expect.objectContaining({
          type: 'daily',
          hour: 20,
          minute: 45,
        }),
      }),
    )
  })

  it('cancels the daily reminder', async () => {
    await dailySadhanaNotificationService.cancelDailyReminder()

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      DAILY_SADHANA_REMINDER_NOTIFICATION_ID,
    )
  })
})
