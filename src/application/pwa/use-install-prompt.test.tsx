import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useInstallPrompt } from '@/application/pwa/use-install-prompt'

function mockMatchMedia(standaloneMatches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)' && standaloneMatches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function makeBeforeInstallPromptEvent() {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  return event
}

describe('useInstallPrompt', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports not installable and not standalone by default', () => {
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.canInstall).toBe(false)
    expect(result.current.isStandalone).toBe(false)
  })

  it('reports standalone when display-mode: standalone matches', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.isStandalone).toBe(true)
  })

  it('becomes installable after beforeinstallprompt fires, and suppresses the default mini-infobar', () => {
    const { result } = renderHook(() => useInstallPrompt())
    const event = makeBeforeInstallPromptEvent()
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(result.current.canInstall).toBe(true)
  })

  it('promptInstall() invokes the captured prompt and clears canInstall once resolved', async () => {
    const { result } = renderHook(() => useInstallPrompt())
    const event = makeBeforeInstallPromptEvent()
    act(() => {
      window.dispatchEvent(event)
    })
    expect(result.current.canInstall).toBe(true)

    await act(async () => {
      await result.current.promptInstall()
    })

    expect(event.prompt).toHaveBeenCalled()
    expect(result.current.canInstall).toBe(false)
  })

  it('becomes standalone and non-installable after an appinstalled event', () => {
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      window.dispatchEvent(makeBeforeInstallPromptEvent())
    })
    expect(result.current.canInstall).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(result.current.canInstall).toBe(false)
    expect(result.current.isStandalone).toBe(true)
  })
})
