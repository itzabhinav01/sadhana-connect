import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '@sadhana-connect/auth'
import { calculateJapaProgress } from '@sadhana-connect/japa'
import { japaCounterLocalStorage } from '@/infrastructure/local-storage/japa-counter-local-storage'
import { DEFAULT_TARGET_ROUNDS } from '@sadhana-connect/japa'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'

const RETENTION_DAYS = 30
const TAP_DEBOUNCE_MS = 150

// Local-only — no Supabase repository is involved anywhere in this
// hook. Every action (tap, undo, reset, target change) works fully
// offline by construction.
export function useJapaCounter() {
  const { session } = useAuth()
  const userId = session?.userId ?? null
  const today = getLocalDateIso()
  const currentKey = userId ? `${userId}:${today}` : null

  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [totalTapsToday, setTotalTapsToday] = useState(0)
  const [target, setTargetState] = useState(DEFAULT_TARGET_ROUNDS)
  const lastTapAtRef = useRef(0)

  // Loads today's count and the target whenever the signed-in user or
  // the calendar date changes — never share state across users or days.
  // Adjusts state during render (React's documented pattern for "reset
  // state when a key changes") rather than in an effect, so this is a
  // synchronous part of rendering the new key, not a follow-up render.
  if (currentKey !== loadedKey) {
    setLoadedKey(currentKey)
    if (userId) {
      setTargetState(japaCounterLocalStorage.getTarget(userId))
      const stored = japaCounterLocalStorage.getDailyState(userId, today)
      setTotalTapsToday(stored?.totalTapsToday ?? 0)
    } else {
      setTotalTapsToday(0)
      setTargetState(DEFAULT_TARGET_ROUNDS)
    }
  }

  // Prunes daily entries older than the retention window — a genuine
  // side effect (mutating storage, not React state), so this does
  // belong in an effect.
  useEffect(() => {
    if (!userId) return
    const cutoff = addDaysIso(today, -(RETENTION_DAYS - 1))
    japaCounterLocalStorage.pruneOldDailyStates(userId, cutoff)
  }, [userId, today])

  // Persist whenever the count changes — on every tap, not batched.
  useEffect(() => {
    if (!userId) return

    japaCounterLocalStorage.setDailyState(userId, today, {
      totalTapsToday,
      updatedAt: new Date().toISOString(),
    })
  }, [userId, today, totalTapsToday])

  // Cross-tab sync: the `storage` event fires in *other* tabs when
  // localStorage changes here, letting this tab pick up taps/undos/reset
  // made in a sibling tab instead of silently diverging from it.
  useEffect(() => {
    if (!userId) return

    function handleStorageEvent() {
      if (!userId) return
      const stored = japaCounterLocalStorage.getDailyState(userId, today)
      setTotalTapsToday(stored?.totalTapsToday ?? 0)
      setTargetState(japaCounterLocalStorage.getTarget(userId))
    }

    window.addEventListener('storage', handleStorageEvent)
    return () => window.removeEventListener('storage', handleStorageEvent)
  }, [userId, today])

  const tap = useCallback(() => {
    // ~150ms debounce guards against a single physical tap firing two
    // synthetic touch events on some mobile browsers — it does not
    // suppress genuinely fast, separate taps beyond that window.
    const now = Date.now()
    if (now - lastTapAtRef.current < TAP_DEBOUNCE_MS) return
    lastTapAtRef.current = now

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }

    setTotalTapsToday((current) => current + 1)
  }, [setTotalTapsToday])

  const undo = useCallback(() => {
    setTotalTapsToday((current) => Math.max(0, current - 1))
  }, [setTotalTapsToday])

  const reset = useCallback(() => {
    setTotalTapsToday(0)
  }, [setTotalTapsToday])

  const setTarget = useCallback(
    (nextTarget: number) => {
      if (!userId) return
      if (!Number.isInteger(nextTarget) || nextTarget <= 0) return

      setTargetState(nextTarget)
      japaCounterLocalStorage.setTarget(userId, nextTarget)
    },
    [userId, setTargetState],
  )

  return {
    ...calculateJapaProgress(totalTapsToday, target),
    tap,
    undo,
    reset,
    setTarget,
  }
}
