import * as Updates from 'expo-updates'
import { appUpdatesService } from './app-updates-service'

jest.mock('expo-updates', () => ({
  isEnabled: false,
  updateId: 'test-update-id',
  channel: 'production',
  createdAt: '2026-08-29T00:00:00.000Z',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}))

describe('appUpdatesService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Updates as { isEnabled: boolean }).isEnabled = false
  })

  it('reports isSupported as false when Updates.isEnabled is false', () => {
    expect(appUpdatesService.isSupported()).toBe(false)
  })

  it('returns false/not supported on checkForUpdate when updates are disabled', async () => {
    const result = await appUpdatesService.checkForUpdate()
    expect(result).toEqual({ isAvailable: false, isSupported: false })
    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled()
  })

  it('checks for update when updates are enabled', async () => {
    ;(Updates as { isEnabled: boolean }).isEnabled = true
    ;(Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({ isAvailable: true })

    const result = await appUpdatesService.checkForUpdate()
    expect(result).toEqual({ isAvailable: true, isSupported: true })
    expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1)
  })

  it('catches and returns error when check fails', async () => {
    ;(Updates as { isEnabled: boolean }).isEnabled = true
    ;(Updates.checkForUpdateAsync as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const result = await appUpdatesService.checkForUpdate()
    expect(result).toEqual({
      isAvailable: false,
      isSupported: true,
      error: 'Network error',
    })
  })

  it('handles "no update found" / 404 cleanly as isAvailable: false', async () => {
    ;(Updates as { isEnabled: boolean }).isEnabled = true
    ;(Updates.checkForUpdateAsync as jest.Mock).mockRejectedValueOnce(new Error('No update found for channel preview'))

    const result = await appUpdatesService.checkForUpdate()
    expect(result).toEqual({
      isAvailable: false,
      isSupported: true,
    })
  })

  it('fetches update when available', async () => {
    ;(Updates as { isEnabled: boolean }).isEnabled = true
    ;(Updates.fetchUpdateAsync as jest.Mock).mockResolvedValueOnce({ isNew: true })

    const success = await appUpdatesService.fetchUpdate()
    expect(success).toBe(true)
    expect(Updates.fetchUpdateAsync).toHaveBeenCalledTimes(1)
  })

  it('calls reloadAsync when reload is called with updates enabled', async () => {
    ;(Updates as { isEnabled: boolean }).isEnabled = true
    await appUpdatesService.reload()
    expect(Updates.reloadAsync).toHaveBeenCalledTimes(1)
  })
})
