jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  DEFAULT_DAILY_REMINDER_SETTINGS,
  dailySadhanaReminderStorage,
} from './daily-sadhana-reminder-storage'

describe('dailySadhanaReminderStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('returns default settings when none are stored', async () => {
    const settings = await dailySadhanaReminderStorage.getSettings('user-1')
    expect(settings).toEqual(DEFAULT_DAILY_REMINDER_SETTINGS)
  })

  it('stores and retrieves custom reminder settings', async () => {
    await dailySadhanaReminderStorage.setSettings('user-1', {
      enabled: true,
      reminderTime: '20:30',
    })

    const settings = await dailySadhanaReminderStorage.getSettings('user-1')
    expect(settings).toEqual({
      enabled: true,
      reminderTime: '20:30',
    })
  })

  it('isolates settings between different user IDs', async () => {
    await dailySadhanaReminderStorage.setSettings('user-1', {
      enabled: true,
      reminderTime: '20:00',
    })
    await dailySadhanaReminderStorage.setSettings('user-2', {
      enabled: false,
      reminderTime: '22:00',
    })

    const user1Settings = await dailySadhanaReminderStorage.getSettings('user-1')
    const user2Settings = await dailySadhanaReminderStorage.getSettings('user-2')

    expect(user1Settings.reminderTime).toBe('20:00')
    expect(user1Settings.enabled).toBe(true)
    expect(user2Settings.reminderTime).toBe('22:00')
    expect(user2Settings.enabled).toBe(false)
  })

  it('falls back to defaults if stored JSON is corrupt', async () => {
    await AsyncStorage.setItem('sadhana-connect:daily-reminder:user-1', 'not-valid-json')

    const settings = await dailySadhanaReminderStorage.getSettings('user-1')
    expect(settings).toEqual(DEFAULT_DAILY_REMINDER_SETTINGS)
  })
})
