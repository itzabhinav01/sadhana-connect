import type { BookReadingStatus } from './books-types'

export interface LocalBookProgressItem {
  status: BookReadingStatus
  completedAt: string | null
  updatedAt: string
}

export interface BookProgressStorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
}

const STORAGE_KEY_PREFIX = 'sadhana-connect:books-progress:'

// In-memory cache map: profileId -> Map<bookId, LocalBookProgressItem>
const memoryCache = new Map<string, Map<number, LocalBookProgressItem>>()

let customAdapter: BookProgressStorageAdapter | null = null

export function setBookProgressStorageAdapter(adapter: BookProgressStorageAdapter | null): void {
  customAdapter = adapter
}

function getStorageKey(profileId: string): string {
  return `${STORAGE_KEY_PREFIX}${profileId}`
}

function getEffectiveAdapter(): BookProgressStorageAdapter | null {
  if (customAdapter) return customAdapter
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (key: string) => {
        try {
          return window.localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value)
        } catch {
          // Ignore quota errors
        }
      },
    }
  }
  return null
}

export function getLocalBookProgressSync(profileId: string): Map<number, LocalBookProgressItem> {
  const cached = memoryCache.get(profileId)
  if (cached) return cached

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      const raw = adapter.getItem(getStorageKey(profileId))
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw) as Record<string, LocalBookProgressItem>
        const map = new Map<number, LocalBookProgressItem>()
        for (const [key, value] of Object.entries(parsed)) {
          const bookId = Number(key)
          if (!Number.isNaN(bookId) && value && value.status) {
            map.set(bookId, value)
          }
        }
        memoryCache.set(profileId, map)
        return map
      }
    } catch {
      // Ignore parse errors
    }
  }

  const freshMap = new Map<number, LocalBookProgressItem>()
  memoryCache.set(profileId, freshMap)
  return freshMap
}

export async function getLocalBookProgressAsync(
  profileId: string,
): Promise<Map<number, LocalBookProgressItem>> {
  const cached = memoryCache.get(profileId)
  if (cached && cached.size > 0) return cached

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      const raw = await adapter.getItem(getStorageKey(profileId))
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw) as Record<string, LocalBookProgressItem>
        const map = new Map<number, LocalBookProgressItem>()
        for (const [key, value] of Object.entries(parsed)) {
          const bookId = Number(key)
          if (!Number.isNaN(bookId) && value && value.status) {
            map.set(bookId, value)
          }
        }
        memoryCache.set(profileId, map)
        return map
      }
    } catch {
      // Ignore parse errors
    }
  }

  return getLocalBookProgressSync(profileId)
}

export function saveLocalBookProgress(
  profileId: string,
  bookId: number,
  status: BookReadingStatus,
  completedAt?: string | null,
): void {
  const map = getLocalBookProgressSync(profileId)
  const item: LocalBookProgressItem = {
    status,
    completedAt: completedAt ?? (status === 'completed' ? new Date().toISOString() : null),
    updatedAt: new Date().toISOString(),
  }
  map.set(bookId, item)
  memoryCache.set(profileId, map)

  const adapter = getEffectiveAdapter()
  if (adapter) {
    try {
      const record: Record<number, LocalBookProgressItem> = {}
      for (const [id, val] of map.entries()) {
        record[id] = val
      }
      void Promise.resolve(adapter.setItem(getStorageKey(profileId), JSON.stringify(record))).catch(
        (err) => console.warn('Could not save local book progress to storage:', err),
      )
    } catch (err) {
      console.warn('Could not serialize local book progress:', err)
    }
  }
}
