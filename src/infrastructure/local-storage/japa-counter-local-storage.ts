import type {
  JapaCounterStorage,
  JapaDailyState,
} from '@/domain/repositories/japa-counter-storage'
import { DEFAULT_TARGET_ROUNDS } from '@/shared/constants/japa'

const STORAGE_PREFIX = 'sadhana-connect:japa'
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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

export const japaCounterLocalStorage: JapaCounterStorage = {
  getTarget(userId) {
    const raw = window.localStorage.getItem(targetKey(userId))
    if (raw === null) return DEFAULT_TARGET_ROUNDS

    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_TARGET_ROUNDS
  },

  setTarget(userId, target) {
    window.localStorage.setItem(targetKey(userId), String(target))
  },

  getDailyState(userId, date) {
    const raw = window.localStorage.getItem(dailyKey(userId, date))
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

  setDailyState(userId, date, state) {
    window.localStorage.setItem(dailyKey(userId, date), JSON.stringify(state))
  },

  pruneOldDailyStates(userId, cutoffDateIso) {
    const keysToRemove: string[] = []

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key) continue

      const date = dailyKeyDate(key, userId)
      if (date && date < cutoffDateIso) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  },
}
