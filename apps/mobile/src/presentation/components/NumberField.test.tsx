jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useForm } from 'react-hook-form'

import { NumberField } from './NumberField'

interface FormValues {
  totalRounds: string
}

function TestForm({
  showStepper,
  quickAmounts,
  defaultValue = '',
}: {
  showStepper?: boolean
  quickAmounts?: number[]
  defaultValue?: string
}) {
  const { control } = useForm<FormValues>({ defaultValues: { totalRounds: defaultValue } })
  return (
    <NumberField
      control={control}
      name="totalRounds"
      label="Total Rounds"
      showStepper={showStepper}
      quickAmounts={quickAmounts}
    />
  )
}

describe('NumberField', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('increments from blank as if starting at 0', async () => {
    const { getByLabelText, getByRole } = await render(<TestForm showStepper defaultValue="" />)
    await fireEvent.press(getByRole('button', { name: 'Increase Total Rounds' }))
    expect(getByLabelText('Total Rounds').props.value).toBe('1')
  })

  it('increments and decrements an existing value by 1', async () => {
    const { getByLabelText, getByRole } = await render(<TestForm showStepper defaultValue="10" />)

    await fireEvent.press(getByRole('button', { name: 'Increase Total Rounds' }))
    expect(getByLabelText('Total Rounds').props.value).toBe('11')

    await fireEvent.press(getByRole('button', { name: 'Decrease Total Rounds' }))
    await fireEvent.press(getByRole('button', { name: 'Decrease Total Rounds' }))
    expect(getByLabelText('Total Rounds').props.value).toBe('9')
  })

  it('never decrements below 0', async () => {
    const { getByLabelText, getByRole } = await render(<TestForm showStepper defaultValue="0" />)
    await fireEvent.press(getByRole('button', { name: 'Decrease Total Rounds' }))
    expect(getByLabelText('Total Rounds').props.value).toBe('0')
  })

  it('does not render stepper buttons when showStepper is false', async () => {
    const { queryByRole } = await render(<TestForm defaultValue="5" />)
    expect(queryByRole('button', { name: 'Increase Total Rounds' })).toBeNull()
    expect(queryByRole('button', { name: 'Decrease Total Rounds' })).toBeNull()
  })

  it('sets the field value when a quick-amount button is pressed', async () => {
    const { getByLabelText, getByRole } = await render(
      <TestForm quickAmounts={[8, 16, 25]} defaultValue="" />,
    )
    await fireEvent.press(getByRole('button', { name: 'Set Total Rounds to 16' }))
    expect(getByLabelText('Total Rounds').props.value).toBe('16')
  })
})
