import * as Updates from 'expo-updates'

export interface CheckUpdateResult {
  isAvailable: boolean
  isSupported: boolean
  error?: string
}

export const appUpdatesService = {
  isSupported(): boolean {
    return Updates.isEnabled
  },

  getUpdateId(): string | null {
    return Updates.updateId ?? null
  },

  getChannel(): string | null {
    return Updates.channel ?? null
  },

  getCreatedAt(): Date | null {
    return Updates.createdAt ? new Date(Updates.createdAt) : null
  },

  async checkForUpdate(): Promise<CheckUpdateResult> {
    if (!Updates.isEnabled) {
      return { isAvailable: false, isSupported: false }
    }

    try {
      const result = await Updates.checkForUpdateAsync()
      return {
        isAvailable: result.isAvailable,
        isSupported: true,
      }
    } catch (error) {
      return {
        isAvailable: false,
        isSupported: true,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
      }
    }
  },

  async fetchUpdate(): Promise<boolean> {
    if (!Updates.isEnabled) {
      return false
    }

    try {
      const result = await Updates.fetchUpdateAsync()
      return result.isNew
    } catch {
      return false
    }
  },

  async reload(): Promise<void> {
    if (!Updates.isEnabled) {
      return
    }

    try {
      await Updates.reloadAsync()
    } catch {
      // Ignore
    }
  },
}
