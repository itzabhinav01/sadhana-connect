import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useJapaCounter } from '@/application/japa/use-japa-counter'
import { japaCounterLocalStorage } from '@/infrastructure/local-storage/japa-counter-local-storage'
import { getLocalDateIso } from '@/shared/utils/date'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

describe('useJapaCounter', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at zero with no stored state', () => {
    const { result } = renderHook(() => useJapaCounter())

    expect(result.current.totalTapsToday).toBe(0)
    expect(result.current.completedRounds).toBe(0)
  })

  it('increments on tap and persists immediately', () => {
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.tap()
    })

    expect(result.current.totalTapsToday).toBe(1)
    const today = getLocalDateIso()
    expect(
      japaCounterLocalStorage.getDailyState('user-1', today)?.totalTapsToday,
    ).toBe(1)
  })

  it('debounces two taps within ~150ms into a single count', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.tap()
      result.current.tap()
    })

    expect(result.current.totalTapsToday).toBe(1)
  })

  it('counts a second tap once the debounce window has passed', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.tap()
    })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => {
      result.current.tap()
    })

    expect(result.current.totalTapsToday).toBe(2)
  })

  it('undo decrements the count by 1', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.tap()
    })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => {
      result.current.tap()
    })
    expect(result.current.totalTapsToday).toBe(2)

    act(() => {
      result.current.undo()
    })
    expect(result.current.totalTapsToday).toBe(1)
  })

  it('undo never reduces the count below zero', () => {
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.undo()
    })

    expect(result.current.totalTapsToday).toBe(0)
  })

  it('reset zeroes the count and persists it', () => {
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.tap()
    })
    expect(result.current.totalTapsToday).toBe(1)

    act(() => {
      result.current.reset()
    })

    expect(result.current.totalTapsToday).toBe(0)
    const today = getLocalDateIso()
    expect(
      japaCounterLocalStorage.getDailyState('user-1', today)?.totalTapsToday,
    ).toBe(0)
  })

  it('restores state on remount (reload recovery)', () => {
    const { result, unmount } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.tap()
    })
    unmount()

    const { result: reloaded } = renderHook(() => useJapaCounter())
    expect(reloaded.current.totalTapsToday).toBe(1)
  })

  it('does not leak a previous day\'s count into today (date isolation)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 10, 0, 0))

    const { result, unmount } = renderHook(() => useJapaCounter())
    act(() => {
      result.current.tap()
    })
    expect(result.current.totalTapsToday).toBe(1)
    unmount()

    vi.setSystemTime(new Date(2026, 0, 16, 10, 0, 0))
    const { result: nextDay } = renderHook(() => useJapaCounter())
    expect(nextDay.current.totalTapsToday).toBe(0)
  })

  it('never shows a previous user\'s count after switching users (user isolation)', () => {
    const { result, rerender } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.tap()
    })
    expect(result.current.totalTapsToday).toBe(1)

    useAuthMock.mockReturnValue({
      session: { userId: 'user-2', email: 'c@d.com', emailConfirmedAt: null },
      isLoading: false,
    })
    rerender()

    expect(result.current.totalTapsToday).toBe(0)
  })

  it('prunes daily entries older than 30 days on load', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15))

    japaCounterLocalStorage.setDailyState('user-1', '2025-11-01', {
      totalTapsToday: 5,
      updatedAt: '2025-11-01T00:00:00.000Z',
    })

    renderHook(() => useJapaCounter())

    expect(
      japaCounterLocalStorage.getDailyState('user-1', '2025-11-01'),
    ).toBeNull()
  })

  it('keeps daily entries within the last 30 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15))

    japaCounterLocalStorage.setDailyState('user-1', '2026-01-05', {
      totalTapsToday: 5,
      updatedAt: '2026-01-05T00:00:00.000Z',
    })

    renderHook(() => useJapaCounter())

    expect(
      japaCounterLocalStorage.getDailyState('user-1', '2026-01-05'),
    ).not.toBeNull()
  })

  it('reflects a target reached beyond exactly 108*target taps, and keeps counting', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.setTarget(1)
    })

    for (let i = 0; i < 110; i += 1) {
      act(() => {
        result.current.tap()
        vi.advanceTimersByTime(200)
      })
    }

    expect(result.current.completedRounds).toBe(1)
    expect(result.current.targetReached).toBe(true)
  })

  it('setTarget persists and is reflected immediately', () => {
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.setTarget(32)
    })

    expect(result.current.targetRounds).toBe(32)
    expect(japaCounterLocalStorage.getTarget('user-1')).toBe(32)
  })

  it('ignores an invalid target (zero, negative, or non-integer)', () => {
    const { result } = renderHook(() => useJapaCounter())

    act(() => {
      result.current.setTarget(0)
    })
    expect(result.current.targetRounds).toBe(16)

    act(() => {
      result.current.setTarget(-5)
    })
    expect(result.current.targetRounds).toBe(16)
  })

  it('vibrates on tap when navigator.vibrate is supported', () => {
    const vibrateMock = vi.fn()
    Object.defineProperty(window.navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
    })

    const { result } = renderHook(() => useJapaCounter())
    act(() => {
      result.current.tap()
    })

    expect(vibrateMock).toHaveBeenCalled()

    Reflect.deleteProperty(window.navigator, 'vibrate')
  })

  it('taps without throwing when navigator.vibrate is unsupported', () => {
    const { result } = renderHook(() => useJapaCounter())

    expect(() => {
      act(() => {
        result.current.tap()
      })
    }).not.toThrow()
  })
})
