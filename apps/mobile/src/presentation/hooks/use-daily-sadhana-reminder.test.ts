import { renderHook, act } from '@testing-library/react-native'

import { useDailySadhanaReminder } from './use-daily-sadhana-reminder'
import { dailySadhanaReminderStorage } from '../../infrastructure/local-storage/daily-sadhana-reminder-storage'
import { dailySadhanaNotificationService } from '../../infrastructure/notifications/daily-sadhana-notification-service'

jest.mock('@sadhana-connect/auth', () => ({
  useAuth: () => ({
    session: { userId: 'user-1', email: 'user@example.com' },
    isLoading: false,
  }),
}))

jest.mock('../../infrastructure/local-storage/daily-sadhana-reminder-storage', () => ({
  DEFAULT_DAILY_REMINDER_SETTINGS: { enabled: false, reminderTime: '21:00' },
  dailySadhanaReminderStorage: {
    getSettings: jest.fn(),
    setSettings: jest.fn(),
  },
}))

jest.mock('../../infrastructure/notifications/daily-sadhana-notification-service', () => ({
  dailySadhanaNotificationService: {
    requestPermissions: jest.fn(),
    scheduleDailyReminder: jest.fn(),
    cancelDailyReminder: jest.fn(),
  },
}))

describe('useDailySadhanaReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(dailySadhanaReminderStorage.getSettings as jest.Mock).mockResolvedValue({
      enabled: false,
      reminderTime: '21:00',
    })
    ;(dailySadhanaNotificationService.scheduleDailyReminder as jest.Mock).mockResolvedValue(true)
  })

  it('loads saved reminder settings on mount', async () => {
    ;(dailySadhanaReminderStorage.getSettings as jest.Mock).mockResolvedValue({
      enabled: true,
      reminderTime: '20:30',
    })

    const { result } = await renderHook(() => useDailySadhanaReminder())

    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.enabled).toBe(true)
    expect(result.current.reminderTime).toBe('20:30')
  })

  it('enables reminder and schedules notification', async () => {
    const { result } = await renderHook(() => useDailySadhanaReminder())
    await act(async () => {})

    let success = false
    await act(async () => {
      success = await result.current.toggleReminder(true)
    })

    expect(success).toBe(true)
    expect(result.current.enabled).toBe(true)
    expect(dailySadhanaNotificationService.scheduleDailyReminder).toHaveBeenCalledWith('21:00')
    expect(dailySadhanaReminderStorage.setSettings).toHaveBeenCalledWith('user-1', {
      enabled: true,
      reminderTime: '21:00',
    })
  })

  it('disables reminder and cancels scheduled notification', async () => {
    ;(dailySadhanaReminderStorage.getSettings as jest.Mock).mockResolvedValue({
      enabled: true,
      reminderTime: '21:00',
    })

    const { result } = await renderHook(() => useDailySadhanaReminder())
    await act(async () => {})

    await act(async () => {
      await result.current.toggleReminder(false)
    })

    expect(result.current.enabled).toBe(false)
    expect(dailySadhanaNotificationService.cancelDailyReminder).toHaveBeenCalled()
    expect(dailySadhanaReminderStorage.setSettings).toHaveBeenCalledWith('user-1', {
      enabled: false,
      reminderTime: '21:00',
    })
  })

  it('changes reminder time and reschedules when enabled', async () => {
    ;(dailySadhanaReminderStorage.getSettings as jest.Mock).mockResolvedValue({
      enabled: true,
      reminderTime: '21:00',
    })

    const { result } = await renderHook(() => useDailySadhanaReminder())
    await act(async () => {})

    await act(async () => {
      await result.current.changeReminderTime('21:30')
    })

    expect(result.current.reminderTime).toBe('21:30')
    expect(dailySadhanaNotificationService.scheduleDailyReminder).toHaveBeenCalledWith('21:30')
    expect(dailySadhanaReminderStorage.setSettings).toHaveBeenCalledWith('user-1', {
      enabled: true,
      reminderTime: '21:30',
    })
  })

  it('sets permissionDenied if permission request fails when enabling', async () => {
    ;(dailySadhanaNotificationService.scheduleDailyReminder as jest.Mock).mockResolvedValue(false)

    const { result } = await renderHook(() => useDailySadhanaReminder())
    await act(async () => {})

    await act(async () => {
      const ok = await result.current.toggleReminder(true)
      expect(ok).toBe(false)
    })

    expect(result.current.permissionDenied).toBe(true)
    expect(result.current.enabled).toBe(false)
  })
})
