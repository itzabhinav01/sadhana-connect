import { useEffect } from 'react'
import type { ReactNode } from 'react'

function applyThemeClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    applyThemeClass(media.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      applyThemeClass(event.matches)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return children
}
