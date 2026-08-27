import { useAuth } from '@sadhana-connect/auth'
import { calculateJapaProgress, DEFAULT_TARGET_ROUNDS } from '@sadhana-connect/japa'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Vibration } from 'react-native'

import { japaCounterAsyncStorage } from '../../infrastructure/local-storage/japa-counter-async-storage'

const RETENTION_DAYS = 30
const TAP_DEBOUNCE_MS = 150

// Local-only, same as web's useJapaCounter — no Supabase repository is
// involved. Unlike web, every read/write here is async (AsyncStorage,
// not localStorage), so loading happens in an effect with an isLoaded
// flag rather than synchronously during render, and there is no
// cross-tab sync (a single mobile app instance has no other tabs to
// sync with).
export function useJapaCounter() {
  const { session } = useAuth()
  const userId = session?.userId ?? null
  const today = getLocalDateIso()
  const currentKey = userId ? `${userId}:${today}` : null

  const [isLoaded, setIsLoaded] = useState(false)
  const [totalTapsToday, setTotalTapsToday] = useState(0)
  const [target, setTargetState] = useState(DEFAULT_TARGET_ROUNDS)
  const lastTapAtRef = useRef(0)

  // Adjusts state during render when the key changes (React's documented
  // pattern for "reset state when a key changes") rather than in an
  // effect — the no-user case resolves synchronously right here, exactly
  // like web's version. The has-user case can't resolve synchronously
  // (AsyncStorage has no sync read), so it only flags "not loaded yet";
  // the effect below performs the actual read and sets state itself,
  // after its own await, which is the pattern React's effects are meant
  // for — not a direct setState in the effect body.
  const [loadedKey, setLoadedKey] = useState<string | null | undefined>(undefined)
  if (currentKey !== loadedKey) {
    setLoadedKey(currentKey)
    if (userId) {
      setIsLoaded(false)
    } else {
      setTotalTapsToday(0)
      setTargetState(DEFAULT_TARGET_ROUNDS)
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    if (!userId || isLoaded) return
    const currentUserId = userId

    let cancelled = false

    async function load() {
      const [storedTarget, storedDaily] = await Promise.all([
        japaCounterAsyncStorage.getTarget(currentUserId),
        japaCounterAsyncStorage.getDailyState(currentUserId, today),
      ])
      if (cancelled) return
      setTargetState(storedTarget)
      setTotalTapsToday(storedDaily?.totalTapsToday ?? 0)
      setIsLoaded(true)
    }
    void load()

    return () => {
      cancelled = true
    }
  }, [userId, today, isLoaded])

  // Prunes daily entries older than the retention window.
  useEffect(() => {
    if (!userId) return
    const cutoff = addDaysIso(today, -(RETENTION_DAYS - 1))
    void japaCounterAsyncStorage.pruneOldDailyStates(userId, cutoff)
  }, [userId, today])

  // Persist whenever the count changes — on every tap, not batched.
  useEffect(() => {
    if (!userId || !isLoaded) return
    void japaCounterAsyncStorage.setDailyState(userId, today, {
      totalTapsToday,
      updatedAt: new Date().toISOString(),
    })
  }, [userId, today, totalTapsToday, isLoaded])

  const tap = useCallback(() => {
    // ~150ms debounce guards against a single physical tap firing two
    // synthetic touch events on some devices — it does not suppress
    // genuinely fast, separate taps beyond that window.
    const now = Date.now()
    if (now - lastTapAtRef.current < TAP_DEBOUNCE_MS) return
    lastTapAtRef.current = now

    Vibration.vibrate(10)
    setTotalTapsToday((current) => current + 1)
  }, [])

  const undo = useCallback(() => {
    setTotalTapsToday((current) => Math.max(0, current - 1))
  }, [])

  const reset = useCallback(() => {
    setTotalTapsToday(0)
  }, [])

  const setTarget = useCallback(
    (nextTarget: number) => {
      if (!userId) return
      if (!Number.isInteger(nextTarget) || nextTarget <= 0) return

      setTargetState(nextTarget)
      void japaCounterAsyncStorage.setTarget(userId, nextTarget)
    },
    [userId],
  )

  return {
    isLoaded,
    ...calculateJapaProgress(totalTapsToday, target),
    tap,
    undo,
    reset,
    setTarget,
  }
}
