import { useTheme } from '../../application/theme/use-theme'
import { Button } from './Button'

// Mirrors web's ThemeToggle: a binary flip on the currently-resolved
// theme (light<->dark), setting and persisting an explicit preference —
// not a 3-way light/dark/system picker. That fuller picker still lives
// on the devotee Profile screen; this is the always-visible quick
// switch the Profile one can't be, since it's in every role layout's
// header instead of a single devotee-only screen.
export function HeaderThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      title={isDark ? 'Light' : 'Dark'}
      variant="outline"
      onPress={() => setTheme(isDark ? 'light' : 'dark')}
    />
  )
}
