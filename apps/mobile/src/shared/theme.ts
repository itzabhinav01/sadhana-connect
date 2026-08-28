export interface ThemeColors {
  background: string
  foreground: string
  muted: string
  mutedBackground: string
  border: string
  primary: string
  primaryForeground: string
  destructive: string
  destructiveBackground: string
  destructiveForeground: string
  link: string
  card: string
}

export const lightColors: ThemeColors = {
  background: '#ffffff',
  foreground: '#1f2937',
  muted: '#6b7280',
  mutedBackground: '#f3f4f6',
  border: '#e5e7eb',
  primary: '#4f46e5',
  primaryForeground: '#ffffff',
  destructive: '#dc2626',
  destructiveBackground: '#fee2e2',
  destructiveForeground: '#7f1d1d',
  link: '#4f46e5',
  card: '#ffffff',
}

export const darkColors: ThemeColors = {
  background: '#111827',
  foreground: '#f9fafb',
  muted: '#9ca3af',
  mutedBackground: '#1f2937',
  border: '#374151',
  primary: '#818cf8',
  primaryForeground: '#1e1b4b',
  destructive: '#f87171',
  destructiveBackground: '#450a0a',
  destructiveForeground: '#fecaca',
  link: '#818cf8',
  card: '#1f2937',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const fontSize = {
  sm: 13,
  base: 15,
  lg: 20,
}
