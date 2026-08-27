import { beforeEach, describe, expect, it } from 'vitest'

import { japaCounterLocalStorage } from '@/infrastructure/local-storage/japa-counter-local-storage'
import { DEFAULT_TARGET_ROUNDS } from '@sadhana-connect/japa'

describe('japaCounterLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('target', () => {
    it('defaults to DEFAULT_TARGET_ROUNDS when nothing is stored', () => {
      expect(japaCounterLocalStorage.getTarget('user-1')).toBe(
        DEFAULT_TARGET_ROUNDS,
      )
    })

    it('persists a set target', () => {
      japaCounterLocalStorage.setTarget('user-1', 32)
      expect(japaCounterLocalStorage.getTarget('user-1')).toBe(32)
    })

    it('scopes the target per user', () => {
      japaCounterLocalStorage.setTarget('user-1', 32)
      expect(japaCounterLocalStorage.getTarget('user-2')).toBe(
        DEFAULT_TARGET_ROUNDS,
      )
    })
  })

  describe('daily state', () => {
    it('returns null when nothing has been counted yet', () => {
      expect(japaCounterLocalStorage.getDailyState('user-1', '2026-01-15')).toBeNull()
    })

    it('persists and retrieves daily state', () => {
      japaCounterLocalStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 42,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })

      expect(
        japaCounterLocalStorage.getDailyState('user-1', '2026-01-15'),
      ).toEqual({ totalTapsToday: 42, updatedAt: '2026-01-15T10:00:00.000Z' })
    })

    it('scopes daily state per user', () => {
      japaCounterLocalStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 42,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })

      expect(
        japaCounterLocalStorage.getDailyState('user-2', '2026-01-15'),
      ).toBeNull()
    })

    it('scopes daily state per date', () => {
      japaCounterLocalStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 42,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })

      expect(
        japaCounterLocalStorage.getDailyState('user-1', '2026-01-16'),
      ).toBeNull()
    })

    it('returns null for corrupted stored JSON rather than throwing', () => {
      window.localStorage.setItem(
        'sadhana-connect:japa:user-1:2026-01-15',
        'not-json',
      )

      expect(
        japaCounterLocalStorage.getDailyState('user-1', '2026-01-15'),
      ).toBeNull()
    })
  })

  describe('pruneOldDailyStates', () => {
    it('removes daily entries older than the cutoff, for this user only', () => {
      japaCounterLocalStorage.setDailyState('user-1', '2025-12-01', {
        totalTapsToday: 10,
        updatedAt: '2025-12-01T00:00:00.000Z',
      })
      japaCounterLocalStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 20,
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
      japaCounterLocalStorage.setDailyState('user-2', '2025-12-01', {
        totalTapsToday: 30,
        updatedAt: '2025-12-01T00:00:00.000Z',
      })

      japaCounterLocalStorage.pruneOldDailyStates('user-1', '2026-01-01')

      expect(
        japaCounterLocalStorage.getDailyState('user-1', '2025-12-01'),
      ).toBeNull()
      expect(
        japaCounterLocalStorage.getDailyState('user-1', '2026-01-15'),
      ).not.toBeNull()
      // Other users' data is never touched by this user's prune call.
      expect(
        japaCounterLocalStorage.getDailyState('user-2', '2025-12-01'),
      ).not.toBeNull()
    })

    it('never removes the target key', () => {
      japaCounterLocalStorage.setTarget('user-1', 32)

      japaCounterLocalStorage.pruneOldDailyStates('user-1', '2099-01-01')

      expect(japaCounterLocalStorage.getTarget('user-1')).toBe(32)
    })
  })
})
