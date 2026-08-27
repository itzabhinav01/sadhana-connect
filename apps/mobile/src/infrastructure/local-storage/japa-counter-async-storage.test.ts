jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { DEFAULT_TARGET_ROUNDS } from '@sadhana-connect/japa'

import AsyncStorage from '@react-native-async-storage/async-storage'

import { japaCounterAsyncStorage } from './japa-counter-async-storage'

describe('japaCounterAsyncStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  describe('target', () => {
    it('defaults to DEFAULT_TARGET_ROUNDS when nothing is stored', async () => {
      expect(await japaCounterAsyncStorage.getTarget('user-1')).toBe(DEFAULT_TARGET_ROUNDS)
    })

    it('persists a set target', async () => {
      await japaCounterAsyncStorage.setTarget('user-1', 32)
      expect(await japaCounterAsyncStorage.getTarget('user-1')).toBe(32)
    })

    it('scopes the target per user', async () => {
      await japaCounterAsyncStorage.setTarget('user-1', 32)
      expect(await japaCounterAsyncStorage.getTarget('user-2')).toBe(DEFAULT_TARGET_ROUNDS)
    })
  })

  describe('daily state', () => {
    it('returns null when nothing has been counted yet', async () => {
      expect(await japaCounterAsyncStorage.getDailyState('user-1', '2026-01-15')).toBeNull()
    })

    it('persists and retrieves daily state', async () => {
      await japaCounterAsyncStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 42,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })

      expect(await japaCounterAsyncStorage.getDailyState('user-1', '2026-01-15')).toEqual({
        totalTapsToday: 42,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })
    })

    it('scopes daily state per user', async () => {
      await japaCounterAsyncStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 42,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })

      expect(await japaCounterAsyncStorage.getDailyState('user-2', '2026-01-15')).toBeNull()
    })

    it('scopes daily state per date', async () => {
      await japaCounterAsyncStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 42,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })

      expect(await japaCounterAsyncStorage.getDailyState('user-1', '2026-01-16')).toBeNull()
    })

    it('returns null for corrupted stored JSON rather than throwing', async () => {
      await AsyncStorage.setItem('sadhana-connect:japa:user-1:2026-01-15', 'not-json')

      expect(await japaCounterAsyncStorage.getDailyState('user-1', '2026-01-15')).toBeNull()
    })
  })

  describe('pruneOldDailyStates', () => {
    it('removes daily entries older than the cutoff, for this user only', async () => {
      await japaCounterAsyncStorage.setDailyState('user-1', '2025-12-01', {
        totalTapsToday: 10,
        updatedAt: '2025-12-01T00:00:00.000Z',
      })
      await japaCounterAsyncStorage.setDailyState('user-1', '2026-01-15', {
        totalTapsToday: 20,
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
      await japaCounterAsyncStorage.setDailyState('user-2', '2025-12-01', {
        totalTapsToday: 30,
        updatedAt: '2025-12-01T00:00:00.000Z',
      })

      await japaCounterAsyncStorage.pruneOldDailyStates('user-1', '2026-01-01')

      expect(await japaCounterAsyncStorage.getDailyState('user-1', '2025-12-01')).toBeNull()
      expect(await japaCounterAsyncStorage.getDailyState('user-1', '2026-01-15')).not.toBeNull()
      // Other users' data is never touched by this user's prune call.
      expect(await japaCounterAsyncStorage.getDailyState('user-2', '2025-12-01')).not.toBeNull()
    })

    it('never removes the target key', async () => {
      await japaCounterAsyncStorage.setTarget('user-1', 32)

      await japaCounterAsyncStorage.pruneOldDailyStates('user-1', '2099-01-01')

      expect(await japaCounterAsyncStorage.getTarget('user-1')).toBe(32)
    })
  })
})
