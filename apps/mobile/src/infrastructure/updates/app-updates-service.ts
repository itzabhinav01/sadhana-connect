import * as Updates from 'expo-updates'

export interface CheckUpdateResult {
  isAvailable: boolean
  isSupported: boolean
  error?: string
  updateMessage?: string | null
  changelog?: string[]
}

function parseChangelog(rawMessage?: string | null): string[] {
  if (!rawMessage || typeof rawMessage !== 'string') return []
  const trimmed = rawMessage.trim()
  if (!trimmed) return []

  // Split by newlines or '+' / bullet points if formatted as a list
  const lines = trimmed.includes('\n')
    ? trimmed.split('\n')
    : trimmed.includes(' + ')
      ? trimmed.split(' + ')
      : [trimmed]

  return lines
    .map((line) => line.replace(/^[-*•+]\s*/, '').trim())
    .filter((line) => line.length > 0)
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
      let updateMessage: string | null = null

      if (result.isAvailable && result.manifest) {
        const manifest = result.manifest as Record<string, unknown>
        const metadata = (manifest.metadata ?? {}) as Record<string, unknown>
        const extra = (manifest.extra ?? {}) as Record<string, unknown>
        const expoClient = (extra.expoClient ?? {}) as Record<string, unknown>
        const clientExtra = (expoClient.extra ?? {}) as Record<string, unknown>

        updateMessage =
          (typeof metadata.message === 'string' && metadata.message) ||
          (typeof manifest.message === 'string' && manifest.message) ||
          (typeof clientExtra.message === 'string' && clientExtra.message) ||
          null
      }

      const changelog = parseChangelog(updateMessage)

      return {
        isAvailable: result.isAvailable,
        isSupported: true,
        updateMessage,
        changelog: changelog.length > 0 ? changelog : undefined,
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
