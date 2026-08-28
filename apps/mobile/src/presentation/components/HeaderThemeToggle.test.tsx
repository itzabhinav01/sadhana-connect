jest.mock('../../application/theme/use-theme', () => ({
  useTheme: jest.fn(),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'

import { useTheme } from '../../application/theme/use-theme'
import { HeaderThemeToggle } from './HeaderThemeToggle'

const mockUseTheme = useTheme as jest.Mock

describe('HeaderThemeToggle', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('shows "Dark" and switches to dark when currently resolved light', async () => {
    const setTheme = jest.fn()
    mockUseTheme.mockReturnValue({
      colors: require('../../shared/theme').lightColors,
      resolvedTheme: 'light',
      setTheme,
    })

    const { getByRole } = await render(<HeaderThemeToggle />)
    const button = getByRole('button', { name: 'Dark' })
    expect(button).toBeTruthy()

    await fireEvent.press(button)
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('shows "Light" and switches to light when currently resolved dark', async () => {
    const setTheme = jest.fn()
    mockUseTheme.mockReturnValue({
      colors: require('../../shared/theme').darkColors,
      resolvedTheme: 'dark',
      setTheme,
    })

    const { getByRole } = await render(<HeaderThemeToggle />)
    const button = getByRole('button', { name: 'Light' })
    expect(button).toBeTruthy()

    await fireEvent.press(button)
    expect(setTheme).toHaveBeenCalledWith('light')
  })
})
