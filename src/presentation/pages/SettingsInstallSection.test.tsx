import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsInstallSection } from '@/presentation/pages/SettingsInstallSection'

const { useInstallPromptMock } = vi.hoisted(() => ({
  useInstallPromptMock: vi.fn(),
}))

vi.mock('@/application/pwa/use-install-prompt', () => ({
  useInstallPrompt: useInstallPromptMock,
}))

describe('SettingsInstallSection', () => {
  const promptInstallMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    promptInstallMock.mockReset()
    promptInstallMock.mockResolvedValue(undefined)
  })

  it('renders nothing when already installed (standalone)', () => {
    useInstallPromptMock.mockReturnValue({
      canInstall: false,
      isStandalone: true,
      isIOS: false,
      promptInstall: promptInstallMock,
    })

    const { container } = render(<SettingsInstallSection />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when not installable and not iOS', () => {
    useInstallPromptMock.mockReturnValue({
      canInstall: false,
      isStandalone: false,
      isIOS: false,
      promptInstall: promptInstallMock,
    })

    const { container } = render(<SettingsInstallSection />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows an Install app button when the browser supports beforeinstallprompt', async () => {
    const user = userEvent.setup()
    useInstallPromptMock.mockReturnValue({
      canInstall: true,
      isStandalone: false,
      isIOS: false,
      promptInstall: promptInstallMock,
    })

    render(<SettingsInstallSection />)
    await user.click(screen.getByRole('button', { name: 'Install app' }))

    expect(promptInstallMock).toHaveBeenCalledTimes(1)
  })

  it('shows static Add to Home Screen instructions on iOS instead of a button', () => {
    useInstallPromptMock.mockReturnValue({
      canInstall: false,
      isStandalone: false,
      isIOS: true,
      promptInstall: promptInstallMock,
    })

    render(<SettingsInstallSection />)

    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument()
  })
})
