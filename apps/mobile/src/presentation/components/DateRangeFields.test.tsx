jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'

import { DateRangeFields } from './DateRangeFields'

describe('DateRangeFields', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('shows placeholder text when both dates are blank', async () => {
    const { getByText } = await render(
      <DateRangeFields
        fromDate=""
        toDate=""
        onFromDateChange={jest.fn()}
        onToDateChange={jest.fn()}
      />,
    )
    expect(getByText('Any')).toBeTruthy()
    expect(getByText('Today')).toBeTruthy()
  })

  it('shows the provided dates when set', async () => {
    const { getByText } = await render(
      <DateRangeFields
        fromDate="2026-01-01"
        toDate="2026-01-31"
        onFromDateChange={jest.fn()}
        onToDateChange={jest.fn()}
      />,
    )
    expect(getByText('2026-01-01')).toBeTruthy()
    expect(getByText('2026-01-31')).toBeTruthy()
  })

  it('exposes distinct accessible labels for the From and To pickers', async () => {
    const { getByRole } = await render(
      <DateRangeFields
        fromDate=""
        toDate=""
        onFromDateChange={jest.fn()}
        onToDateChange={jest.fn()}
      />,
    )
    expect(getByRole('button', { name: 'From date' })).toBeTruthy()
    expect(getByRole('button', { name: 'To date' })).toBeTruthy()
  })

  it('does not crash when a date button is pressed', async () => {
    const { getByRole } = await render(
      <DateRangeFields
        fromDate=""
        toDate=""
        onFromDateChange={jest.fn()}
        onToDateChange={jest.fn()}
      />,
    )
    await fireEvent.press(getByRole('button', { name: 'From date' }))
  })
})
