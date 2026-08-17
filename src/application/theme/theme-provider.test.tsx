import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { ThemeProvider } from '@/application/theme/theme-provider'
import { useTheme } from '@/application/theme/use-theme'

const STORAGE_KEY = 'sadhana-connect-theme'

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <span>theme:{theme}</span>
      <span>resolved:{resolvedTheme}</span>
      <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
        toggle
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to the system preference when no preference is stored', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    // jsdom's matchMedia polyfill reports matches: false (light).
    expect(screen.getByText('theme:system')).toBeInTheDocument()
    expect(screen.getByText('resolved:light')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reads a previously stored explicit preference on mount', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark')

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('theme:dark')).toBeInTheDocument()
    expect(screen.getByText('resolved:dark')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggling sets and persists an explicit preference', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'toggle' }))

    await waitFor(() => {
      expect(screen.getByText('theme:dark')).toBeInTheDocument()
    })
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
