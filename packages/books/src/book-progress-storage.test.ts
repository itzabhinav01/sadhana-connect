import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getLocalBookProgressAsync,
  getLocalBookProgressSync,
  saveLocalBookProgress,
  setBookProgressStorageAdapter,
} from './book-progress-storage'

describe('book-progress-storage', () => {
  const store = new Map<string, string>()

  const mockAdapter = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
  }

  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
    setBookProgressStorageAdapter(mockAdapter)
  })

  it('saves and retrieves book progress for a profile', async () => {
    saveLocalBookProgress('user-1', 1, 'reading')
    saveLocalBookProgress('user-1', 2, 'completed', '2026-01-01T00:00:00Z')

    const syncMap = getLocalBookProgressSync('user-1')
    expect(syncMap.get(1)?.status).toBe('reading')
    expect(syncMap.get(2)?.status).toBe('completed')
    expect(syncMap.get(2)?.completedAt).toBe('2026-01-01T00:00:00Z')

    const asyncMap = await getLocalBookProgressAsync('user-1')
    expect(asyncMap.get(1)?.status).toBe('reading')
    expect(asyncMap.get(2)?.status).toBe('completed')
  })

  it('isolates book progress by profileId', () => {
    saveLocalBookProgress('user-1', 1, 'completed')
    saveLocalBookProgress('user-2', 1, 'reading')

    expect(getLocalBookProgressSync('user-1').get(1)?.status).toBe('completed')
    expect(getLocalBookProgressSync('user-2').get(1)?.status).toBe('reading')
  })

  it('handles invalid JSON gracefully', async () => {
    store.set('sadhana-connect:books-progress:corrupt-user', '{invalid json')

    const map = await getLocalBookProgressAsync('corrupt-user')
    expect(map.size).toBe(0)
  })
})
