export interface ThemeColors {
  background: string
  foreground: string
  muted: string
  mutedBackground: string
  border: string
  primary: string
  primaryForeground: string
  // A low-opacity tint of `primary` for badges/chips/highlights — never
  // used as a base surface, only as an accent behind small amounts of
  // text (streaks, active states) so `primary` itself stays reserved for
  // buttons/links.
  primarySoft: string
  destructive: string
  destructiveBackground: string
  destructiveForeground: string
  link: string
  card: string
  // Shadow base color for Card/Button elevation — always a near-black
  // value even in dark mode (shadows read as "darker than the surface",
  // not literally black), used only via shadowColor with a low opacity.
  shadow: string
}

// "Indigo Dusk" — cool indigo accent on clean neutrals. Chosen 2026-08-28
// over three warmer/devotional-coded alternatives (saffron, teal,
// mono+gold) as a deliberate product decision: modern and calm rather
// than leaning into the "orange spiritual app" cliche.
export const lightColors: ThemeColors = {
  background: '#fafaff',
  foreground: '#18181b',
  muted: '#71717a',
  mutedBackground: '#f4f4f5',
  border: '#e4e4e7',
  primary: '#6366f1',
  primaryForeground: '#ffffff',
  primarySoft: '#eef2ff',
  destructive: '#dc2626',
  destructiveBackground: '#fee2e2',
  destructiveForeground: '#7f1d1d',
  link: '#6366f1',
  card: '#ffffff',
  shadow: '#18181b',
}

export const darkColors: ThemeColors = {
  background: '#0f0f17',
  foreground: '#f4f4f5',
  muted: '#a1a1aa',
  mutedBackground: '#1c1c24',
  border: '#27272f',
  primary: '#818cf8',
  primaryForeground: '#1e1b4b',
  primarySoft: '#1e1e33',
  destructive: '#f87171',
  destructiveBackground: '#450a0a',
  destructiveForeground: '#fecaca',
  link: '#818cf8',
  card: '#18181f',
  shadow: '#000000',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const fontSize = {
  // xs/xl/xxl added for the modernized Dashboard's greeting/hero
  // treatment — sm/base/lg keep their original values since ~140
  // existing call sites across the app already depend on them.
  xs: 12,
  sm: 13,
  base: 15,
  lg: 20,
  xl: 26,
  xxl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
}
