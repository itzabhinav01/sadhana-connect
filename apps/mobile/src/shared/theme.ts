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
  // Semantic success/warning — added for the mobile redesign (save
  // confirmations, streak growth, the retention grace-period banner,
  // missed-day states). Mirrors the lightened-for-dark-mode pattern
  // already used for primary/destructive.
  success: string
  successBackground: string
  warning: string
  warningBackground: string
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
  success: '#16a34a',
  successBackground: '#f0fdf4',
  warning: '#b45309',
  warningBackground: '#fffbeb',
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
  success: '#4ade80',
  successBackground: '#0f2418',
  warning: '#fbbf24',
  warningBackground: '#2e2410',
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
  // Above a dashboard hero or below a sticky footer bar, where xl reads
  // too tight once numeric emphasis (fontSize.display) is in play.
  xxl: 48,
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
  // The one or two hero numbers per screen (today's rounds, current
  // streak, the Japa tap count) — one step above xxl, used sparingly.
  display: 40,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
}

// Minimum hit-area side length for any icon-only tappable control
// (WCAG 2.5.5 / Android accessibility guidance) — checked via
// hitSlop or minWidth/minHeight, not a spacing value.
export const touchTarget = 44

// Poppins, loaded via @expo-google-fonts/poppins in app/_layout.tsx and
// applied as the default for every Text/TextInput there — these names
// are only needed where a style explicitly wants a heavier weight than
// the Regular default (the default-font hook can't vary by fontWeight,
// since a static Google Font file IS a single fixed weight, unlike a
// system font where fontWeight fakes a heavier render on the fly).
export const fontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
}

export interface SectionAccent {
  color: string
  soft: string
}

// One accent per Sadhana form field group (Chanting/Reading/Hearing/Rest
// & Sleep/Schedule) — same grouping buildSadhanaReportExportSections
// already uses for the PDF/text export, so the live form now visually
// matches what gets exported. Notes/Signature deliberately has no entry
// here — free-text fields don't need a color identity the way a
// practice category does. Chanting reuses the app's own primary/
// primarySoft rather than a 6th color, since it's the central practice,
// not one category among equals.
export const sectionAccents: { light: Record<string, SectionAccent>; dark: Record<string, SectionAccent> } = {
  light: {
    chanting: { color: '#6366f1', soft: '#eef2ff' },
    reading: { color: '#d97706', soft: '#fffbeb' },
    hearing: { color: '#0d9488', soft: '#f0fdfa' },
    rest: { color: '#9333ea', soft: '#faf5ff' },
    schedule: { color: '#475569', soft: '#f1f5f9' },
  },
  dark: {
    chanting: { color: '#818cf8', soft: '#1e1e33' },
    reading: { color: '#fbbf24', soft: '#2e2410' },
    hearing: { color: '#2dd4bf', soft: '#0f2a27' },
    rest: { color: '#c084fc', soft: '#2a1a3d' },
    schedule: { color: '#94a3b8', soft: '#1e293b' },
  },
}
