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
      const message = error instanceof Error ? error.message : 'Failed to check for updates'
      if (
        message.toLowerCase().includes('no update') ||
        message.toLowerCase().includes('not found') ||
        message.toLowerCase().includes('404')
      ) {
        return {
          isAvailable: false,
          isSupported: true,
        }
      }
      return {
        isAvailable: false,
        isSupported: true,
        error: message,
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
