import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDailySadhanaReminder } from './use-daily-sadhana-reminder'

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: () => ({
    session: { userId: 'user-web-1', email: 'user@example.com' },
    isLoading: false,
  }),
}))

describe('useDailySadhanaReminder (Web)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    })
  })

  it('loads default settings when localStorage is empty', () => {
    const { result } = renderHook(() => useDailySadhanaReminder())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.enabled).toBe(false)
    expect(result.current.reminderTime).toBe('21:00')
  })

  it('loads stored reminder settings from localStorage', () => {
    localStorage.setItem(
      'sadhana-connect:daily-reminder:user-web-1',
      JSON.stringify({ enabled: true, reminderTime: '20:30' }),
    )

    const { result } = renderHook(() => useDailySadhanaReminder())

    expect(result.current.enabled).toBe(true)
    expect(result.current.reminderTime).toBe('20:30')
  })

  it('toggles reminder state and requests notification permission', async () => {
    const { result } = renderHook(() => useDailySadhanaReminder())

    await act(async () => {
      const ok = await result.current.toggleReminder(true)
      expect(ok).toBe(true)
    })

    expect(result.current.enabled).toBe(true)
    expect(localStorage.getItem('sadhana-connect:daily-reminder:user-web-1')).toContain('"enabled":true')
  })

  it('changes reminder time and updates localStorage', async () => {
    const { result } = renderHook(() => useDailySadhanaReminder())

    await act(async () => {
      await result.current.changeReminderTime('21:45')
    })

    expect(result.current.reminderTime).toBe('21:45')
    expect(localStorage.getItem('sadhana-connect:daily-reminder:user-web-1')).toContain('"reminderTime":"21:45"')
  })
})
