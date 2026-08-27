import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_TARGET_ROUNDS } from '@sadhana-connect/japa'

const STORAGE_PREFIX = 'sadhana-connect:japa'
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface JapaDailyState {
  totalTapsToday: number
  updatedAt: string
}

function targetKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}:target`
}

function dailyKey(userId: string, date: string): string {
  return `${STORAGE_PREFIX}:${userId}:${date}`
}

// Extracts the date suffix from a daily key for this user, or null if
// the key isn't a daily key for this user at all (e.g. it's the target
// key, or belongs to a different user).
function dailyKeyDate(key: string, userId: string): string | null {
  const prefix = `${STORAGE_PREFIX}:${userId}:`
  if (!key.startsWith(prefix)) return null
  const suffix = key.slice(prefix.length)
  return DATE_KEY_PATTERN.test(suffix) ? suffix : null
}

// Mobile equivalent of web's japaCounterLocalStorage (Phase 10) —
// AsyncStorage instead of localStorage, so every operation here is
// async unlike the web version's synchronous reads/writes. Same key
// scheme, same 30-day retention policy, same local-only, no-Supabase
// scope.
export const japaCounterAsyncStorage = {
  async getTarget(userId: string): Promise<number> {
    const raw = await AsyncStorage.getItem(targetKey(userId))
    if (raw === null) return DEFAULT_TARGET_ROUNDS

    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_TARGET_ROUNDS
  },

  async setTarget(userId: string, target: number): Promise<void> {
    await AsyncStorage.setItem(targetKey(userId), String(target))
  },

  async getDailyState(userId: string, date: string): Promise<JapaDailyState | null> {
    const raw = await AsyncStorage.getItem(dailyKey(userId, date))
    if (raw === null) return null

    try {
      const parsed = JSON.parse(raw) as Partial<JapaDailyState>
      if (typeof parsed.totalTapsToday !== 'number') return null
      return {
        totalTapsToday: parsed.totalTapsToday,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      }
    } catch {
      return null
    }
  },

  async setDailyState(userId: string, date: string, state: JapaDailyState): Promise<void> {
    await AsyncStorage.setItem(dailyKey(userId, date), JSON.stringify(state))
  },

  async pruneOldDailyStates(userId: string, cutoffDateIso: string): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys()
    const keysToRemove = allKeys.filter((key) => {
      const date = dailyKeyDate(key, userId)
      return date !== null && date < cutoffDateIso
    })

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove)
    }
  },
}
