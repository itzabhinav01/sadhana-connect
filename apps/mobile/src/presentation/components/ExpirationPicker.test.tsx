jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'

import { ExpirationPicker } from './ExpirationPicker'

describe('ExpirationPicker', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('calls onPresetChange when a preset button is pressed', async () => {
    const onPresetChange = jest.fn()
    const { getByRole } = await render(
      <ExpirationPicker
        preset="never"
        customDateIso={null}
        onPresetChange={onPresetChange}
        onCustomDateChange={jest.fn()}
      />,
    )

    await fireEvent.press(getByRole('button', { name: '7 days' }))
    expect(onPresetChange).toHaveBeenCalledWith('7d')
  })

  it('shows the custom date control only when the custom preset is selected', async () => {
    const { queryByLabelText, rerender } = await render(
      <ExpirationPicker
        preset="never"
        customDateIso={null}
        onPresetChange={jest.fn()}
        onCustomDateChange={jest.fn()}
      />,
    )
    expect(queryByLabelText('Expiration date')).toBeNull()

    await rerender(
      <ExpirationPicker
        preset="custom"
        customDateIso={null}
        onPresetChange={jest.fn()}
        onCustomDateChange={jest.fn()}
      />,
    )
    expect(queryByLabelText('Expiration date')).toBeTruthy()
  })

  it('renders the error text when error is set', async () => {
    const { getByText } = await render(
      <ExpirationPicker
        preset="custom"
        customDateIso={null}
        onPresetChange={jest.fn()}
        onCustomDateChange={jest.fn()}
        error="Choose an expiration date."
      />,
    )
    expect(getByText('Choose an expiration date.')).toBeTruthy()
  })
})
