import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useColorScheme } from 'react-native'

import { darkColors, lightColors } from '../../shared/theme'
import type { ResolvedTheme, Theme } from './theme-context'
import { ThemeContext } from './theme-context'

const STORAGE_KEY = 'sadhana-connect-theme'

// Mirrors web's ThemeProvider (light/dark/system + persisted override), but
// every storage read here is async (AsyncStorage, not localStorage) — so
// unlike web, the stored preference isn't known synchronously on first
// render. Until it loads, this renders with the system preference as a
// reasonable default rather than blocking on a loading state; if a stored
// override exists, applying it one tick later is a small, one-time
// discrepancy, not a persistent bug.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (cancelled) return
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : theme
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors

  const setTheme = (next: Theme) => {
    setThemeState(next)
    if (next === 'system') {
      void AsyncStorage.removeItem(STORAGE_KEY)
    } else {
      void AsyncStorage.setItem(STORAGE_KEY, next)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
