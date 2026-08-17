import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import type { ResolvedTheme, Theme } from '@/application/theme/theme-context'
import { ThemeContext } from '@/application/theme/theme-context'

const STORAGE_KEY = 'sadhana-connect-theme'

function getStoredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyThemeClass(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  // Only read/used when theme === 'system' — tracked separately (rather
  // than folded into a single "resolvedTheme" state set from an effect)
  // so resolvedTheme itself can stay a plain derived value.
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    getSystemPrefersDark,
  )

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme

  useEffect(() => {
    applyThemeClass(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    if (next === 'system') {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
