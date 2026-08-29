import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { appUpdatesService } from '../../infrastructure/updates/app-updates-service'

export interface UseAppUpdatesOptions {
  checkOnMount?: boolean
  promptUserOnUpdate?: boolean
}

export function useAppUpdates(options: UseAppUpdatesOptions = {}) {
  const { checkOnMount = false, promptUserOnUpdate = true } = options
  const [isChecking, setIsChecking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = appUpdatesService.isSupported()

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
          Alert.alert('App Updates', 'Updates are only available in installed app builds.')
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
            Alert.alert('Update Check Failed', 'Could not reach update server. Please check your connection.')
          }
          return
        }

        if (result.isAvailable) {
          setIsUpdateAvailable(true)
          if (promptUserOnUpdate) {
            Alert.alert(
              'Update Available 🎉',
              'A new update is ready. Would you like to download and restart the app now?',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Update Now',
                  onPress: () => {
                    void downloadAndApplyUpdate()
                  },
                },
              ],
            )
          }
        } else if (isManualCheck) {
          Alert.alert('Up to Date', 'You are already running the latest version.')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to check for updates'
        setError(msg)
        if (isManualCheck) {
          Alert.alert('Update Check Failed', msg)
        }
      } finally {
        setIsChecking(false)
      }
    },
    [isSupported, promptUserOnUpdate, downloadAndApplyUpdate],
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
    checkForUpdates,
    downloadAndApplyUpdate,
    reloadApp,
  }
}
