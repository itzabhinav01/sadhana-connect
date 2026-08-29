jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

import { fireEvent, render } from '@testing-library/react-native'
import { useAppUpdates } from '../hooks/use-app-updates'
import { AppUpdateSection } from './AppUpdateSection'

jest.mock('../hooks/use-app-updates')

describe('AppUpdateSection', () => {
  const mockCheckForUpdates = jest.fn()
  const mockDownloadAndApplyUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAppUpdates as jest.Mock).mockReturnValue({
      isSupported: true,
      isChecking: false,
      isDownloading: false,
      isUpdateAvailable: false,
      checkForUpdates: mockCheckForUpdates,
      downloadAndApplyUpdate: mockDownloadAndApplyUpdate,
    })
  })

  it('renders check for updates button and triggers check on press', async () => {
    const { getByText } = await render(<AppUpdateSection />)

    expect(getByText('App Updates')).toBeTruthy()
    const button = getByText('Check for updates')
    expect(button).toBeTruthy()

    fireEvent.press(button)
    expect(mockCheckForUpdates).toHaveBeenCalledWith(true)
  })

  it('shows update available and triggers update on press', async () => {
    ;(useAppUpdates as jest.Mock).mockReturnValue({
      isSupported: true,
      isChecking: false,
      isDownloading: false,
      isUpdateAvailable: true,
      checkForUpdates: mockCheckForUpdates,
      downloadAndApplyUpdate: mockDownloadAndApplyUpdate,
    })

    const { getByText } = await render(<AppUpdateSection />)

    expect(getByText('A new update is available!')).toBeTruthy()
    const updateButton = getByText('Update & Restart Now')
    expect(updateButton).toBeTruthy()

    fireEvent.press(updateButton)
    expect(mockDownloadAndApplyUpdate).toHaveBeenCalled()
  })
})
