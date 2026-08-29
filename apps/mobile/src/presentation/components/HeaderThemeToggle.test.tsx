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

  it('shows switch to dark mode icon button and switches to dark when currently resolved light', async () => {
    const setTheme = jest.fn()
    mockUseTheme.mockReturnValue({
      colors: require('../../shared/theme').lightColors,
      resolvedTheme: 'light',
      setTheme,
    })

    const { getByRole } = await render(<HeaderThemeToggle />)
    const button = getByRole('button', { name: 'Switch to dark mode' })
    expect(button).toBeTruthy()

    await fireEvent.press(button)
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('shows switch to light mode icon button and switches to light when currently resolved dark', async () => {
    const setTheme = jest.fn()
    mockUseTheme.mockReturnValue({
      colors: require('../../shared/theme').darkColors,
      resolvedTheme: 'dark',
      setTheme,
    })

    const { getByRole } = await render(<HeaderThemeToggle />)
    const button = getByRole('button', { name: 'Switch to light mode' })
    expect(button).toBeTruthy()

    await fireEvent.press(button)
    expect(setTheme).toHaveBeenCalledWith('light')
  })
})
