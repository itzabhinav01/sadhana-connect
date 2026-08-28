import { createContext } from 'react'

import type { ThemeColors } from '../../shared/theme'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  // The stored preference — 'system' means no explicit choice has been made.
  theme: Theme
  // The theme actually applied right now.
  resolvedTheme: ResolvedTheme
  colors: ThemeColors
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
