import { act, renderHook } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { appUpdatesService } from '../../infrastructure/updates/app-updates-service'
import { useAppUpdates } from './use-app-updates'

jest.mock('../../infrastructure/updates/app-updates-service', () => ({
  appUpdatesService: {
    isSupported: jest.fn(),
    checkForUpdate: jest.fn(),
    fetchUpdate: jest.fn(),
    reload: jest.fn(),
  },
}))

describe('useAppUpdates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('reports isSupported as false when service returns false', async () => {
    ;(appUpdatesService.isSupported as jest.Mock).mockReturnValue(false)
    const { result } = await renderHook(() => useAppUpdates())
    expect(result.current.isSupported).toBe(false)
  })

  it('notifies user on manual check when not supported', async () => {
    ;(appUpdatesService.isSupported as jest.Mock).mockReturnValue(false)
    const { result } = await renderHook(() => useAppUpdates())

    await act(async () => {
      await result.current.checkForUpdates(true)
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'App Updates',
      'Updates are only available in installed app builds.',
    )
  })

  it('checks for updates when supported and alerts on available update', async () => {
    ;(appUpdatesService.isSupported as jest.Mock).mockReturnValue(true)
    ;(appUpdatesService.checkForUpdate as jest.Mock).mockResolvedValueOnce({
      isAvailable: true,
      isSupported: true,
    })

    const { result } = await renderHook(() => useAppUpdates({ promptUserOnUpdate: true }))

    await act(async () => {
      await result.current.checkForUpdates(false)
    })

    expect(result.current.isUpdateAvailable).toBe(true)
    expect(Alert.alert).toHaveBeenCalledWith(
      'Update Available 🎉',
      expect.any(String),
      expect.any(Array),
    )
  })

  it('downloads and applies update on command', async () => {
    ;(appUpdatesService.isSupported as jest.Mock).mockReturnValue(true)
    ;(appUpdatesService.fetchUpdate as jest.Mock).mockResolvedValueOnce(true)

    const { result } = await renderHook(() => useAppUpdates())

    await act(async () => {
      await result.current.downloadAndApplyUpdate()
    })

    expect(result.current.isUpdateDownloaded).toBe(true)
    expect(appUpdatesService.reload).toHaveBeenCalledTimes(1)
  })
})
