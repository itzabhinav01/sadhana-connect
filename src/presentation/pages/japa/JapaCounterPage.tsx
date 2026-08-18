import { useEffect } from 'react'

import { useJapaCounter } from '@/application/japa/use-japa-counter'
import { JapaControls } from '@/presentation/pages/japa/JapaControls'
import { JapaProgressDisplay } from '@/presentation/pages/japa/JapaProgressDisplay'
import { JapaSadhanaIntegration } from '@/presentation/pages/japa/JapaSadhanaIntegration'
import { JapaTapButton } from '@/presentation/pages/japa/JapaTapButton'

export function JapaCounterPage() {
  const japa = useJapaCounter()
  const { tap, undo, reset, setTarget, ...progress } = japa

  // Keeps the screen awake while this page is open, so a long chanting
  // session doesn't get interrupted by the device locking. Fails
  // silently where unsupported (e.g. iOS Safari) — never blocks the
  // counter itself.
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    async function requestWakeLock() {
      if (!('wakeLock' in navigator)) return
      try {
        wakeLock = await navigator.wakeLock.request('screen')
      } catch {
        // Ignore — e.g. permission denied, or the document isn't
        // visible yet. The counter itself works regardless.
      }
    }

    void requestWakeLock()

    return () => {
      void wakeLock?.release()
    }
  }, [])

  // Space = tap, Backspace = undo, page-wide — guarded so typing in the
  // target-rounds input (the only editable field on this page) behaves
  // normally instead of triggering a tap/undo.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)

      if (isEditableTarget) return

      if (event.code === 'Space') {
        event.preventDefault()
        tap()
      } else if (event.code === 'Backspace') {
        event.preventDefault()
        undo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tap, undo])

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-foreground">
          Japa Counter
        </h1>
        <p className="text-muted-foreground">
          Tap to count each mantra. 108 beads make one round.
        </p>
      </div>

      <JapaProgressDisplay progress={progress} />

      <JapaTapButton progress={progress} onTap={tap} />

      <JapaSadhanaIntegration completedRounds={progress.completedRounds} />

      <JapaControls
        target={progress.targetRounds}
        canUndo={progress.totalTapsToday > 0}
        onUndo={undo}
        onReset={reset}
        onTargetChange={setTarget}
      />
    </div>
  )
}
