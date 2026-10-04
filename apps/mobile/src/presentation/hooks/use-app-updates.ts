import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { appUpdatesService } from '../../infrastructure/updates/app-updates-service'

export interface UpdatePromptState {
  type: 'update-available' | 'up-to-date' | 'error' | 'info'
  title: string
  message: string
}

export interface UseAppUpdatesOptions {
  checkOnMount?: boolean
  promptUserOnUpdate?: boolean
  useThemedModal?: boolean
}

export function useAppUpdates(options: UseAppUpdatesOptions = {}) {
  const {
    checkOnMount = false,
    promptUserOnUpdate = true,
    useThemedModal = false,
  } = options
  const [isChecking, setIsChecking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatePrompt, setUpdatePrompt] = useState<UpdatePromptState | null>(null)

  const isSupported = appUpdatesService.isSupported()

  const dismissUpdatePrompt = useCallback(() => {
    setUpdatePrompt(null)
  }, [])

  const reloadApp = useCallback(async () => {
    await appUpdatesService.reload()
  }, [])

  const downloadAndApplyUpdate = useCallback(async () => {
    setIsDownloading(true)
    setError(null)
    try {
      const isNew = await appUpdatesService.fetchUpdate()
      if (isNew) {
        setIsUpdateDownloaded(true)
        setUpdatePrompt(null)
        await appUpdatesService.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download update')
    } finally {
      setIsDownloading(false)
    }
  }, [])

  const checkForUpdates = useCallback(
    async (isManualCheck = false) => {
      if (!isSupported) {
        if (isManualCheck) {
          const title = 'App Updates'
          const message = 'Updates are only available in installed app builds.'
          setUpdatePrompt({ type: 'info', title, message })
          if (!useThemedModal) {
            Alert.alert(title, message)
          }
        }
        return
      }

      setIsChecking(true)
      setError(null)

      try {
        const result = await appUpdatesService.checkForUpdate()

        if (result.error) {
          setError(result.error)
          if (isManualCheck) {
            const title = 'Update Check Failed'
            setUpdatePrompt({ type: 'error', title, message: result.error })
            if (!useThemedModal) {
              Alert.alert(title, result.error)
            }
          }
          return
        }

        if (result.isAvailable) {
          setIsUpdateAvailable(true)
          if (promptUserOnUpdate || isManualCheck) {
            const title = 'Update Available 🎉'
            const message =
              'A new update of Sadhana Connect is ready with the latest improvements. Would you like to download and restart now?'
            setUpdatePrompt({ type: 'update-available', title, message })
            if (!useThemedModal && promptUserOnUpdate) {
              Alert.alert(title, message, [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Update Now',
                  onPress: () => {
                    void downloadAndApplyUpdate()
                  },
                },
              ])
            }
          }
        } else if (isManualCheck) {
          const title = 'Up to Date'
          const message = 'You are already running the latest version of Sadhana Connect.'
          setUpdatePrompt({ type: 'up-to-date', title, message })
          if (!useThemedModal) {
            Alert.alert(title, message)
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to check for updates'
        setError(msg)
        if (isManualCheck) {
          const title = 'Update Check Failed'
          setUpdatePrompt({ type: 'error', title, message: msg })
          if (!useThemedModal) {
            Alert.alert(title, msg)
          }
        }
      } finally {
        setIsChecking(false)
      }
    },
    [isSupported, promptUserOnUpdate, useThemedModal, downloadAndApplyUpdate],
  )

  useEffect(() => {
    if (!checkOnMount || !isSupported) return
    const timer = setTimeout(() => {
      void checkForUpdates(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [checkOnMount, isSupported, checkForUpdates])

  return {
    isSupported,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdateDownloaded,
    error,
    updatePrompt,
    dismissUpdatePrompt,
    checkForUpdates,
    downloadAndApplyUpdate,
    reloadApp,
  }
}
