jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Text, View } from 'react-native'

import { ThemeProvider } from './theme-provider'
import { useTheme } from './use-theme'

const STORAGE_KEY = 'sadhana-connect-theme'
const mockUseColorScheme = jest.requireMock('react-native/Libraries/Utilities/useColorScheme')
  .default as jest.Mock

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <View>
      <Text>theme:{theme}</Text>
      <Text>resolved:{resolvedTheme}</Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="toggle"
        onPress={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        toggle
      </Text>
    </View>
  )
}

describe('ThemeProvider', () => {
  beforeEach(async () => {
    mockUseColorScheme.mockReturnValue('light')
    await AsyncStorage.clear()
  })

  afterEach(async () => {
    await cleanup()
  })

  it('defaults to the system preference when no preference is stored', async () => {
    const { getByText } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(getByText('theme:system')).toBeTruthy()
    expect(getByText('resolved:light')).toBeTruthy()
  })

  it('follows the system preference when it is dark and no override is stored', async () => {
    mockUseColorScheme.mockReturnValue('dark')

    const { getByText } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(getByText('theme:system')).toBeTruthy()
    expect(getByText('resolved:dark')).toBeTruthy()
  })

  it('reads a previously stored explicit preference on mount', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'dark')

    const { getByText } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(getByText('theme:dark')).toBeTruthy()
    })
    expect(getByText('resolved:dark')).toBeTruthy()
  })

  it('toggling sets and persists an explicit preference', async () => {
    const { getByText, getByRole } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await fireEvent.press(getByRole('button', { name: 'toggle' }))

    await waitFor(() => {
      expect(getByText('theme:dark')).toBeTruthy()
    })
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('toggling back to an explicit light preference persists it too', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'dark')

    const { getByText, getByRole } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    await waitFor(() => {
      expect(getByText('theme:dark')).toBeTruthy()
    })

    await fireEvent.press(getByRole('button', { name: 'toggle' }))

    await waitFor(() => {
      expect(getByText('theme:light')).toBeTruthy()
    })
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('light')
  })
})

describe('useTheme', () => {
  it('throws when used outside a ThemeProvider', async () => {
    // Swallow the expected React error-boundary console noise for this
    // one negative-path assertion.
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(render(<Probe />)).rejects.toThrow('useTheme must be used within a ThemeProvider')
    consoleErrorSpy.mockRestore()
  })
})
