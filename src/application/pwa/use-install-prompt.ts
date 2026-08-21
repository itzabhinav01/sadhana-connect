import { useEffect, useState } from 'react'

// Chrome/Edge-only event — not yet part of the standard DOM lib types.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function getIsStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari's non-standard flag for "launched from the home screen" —
  // iOS never fires beforeinstallprompt or (display-mode: standalone)
  // the same way Chromium does, so it needs its own check.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function getIsIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// Drives the "Install app" section in Settings. Chromium browsers fire
// beforeinstallprompt when they judge the app installable; iOS Safari
// never fires it at all, so isIOS lets the caller show static
// instructions instead of a non-functional button.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(getIsStandalone)

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      // Prevents Chrome's default mini-infobar — this app shows its own
      // install entry point instead, on the user's own visit to Settings.
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return {
    canInstall: deferredPrompt !== null,
    isStandalone,
    isIOS: getIsIOS(),
    promptInstall,
  }
}
