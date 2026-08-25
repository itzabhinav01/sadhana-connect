import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DateRangeInputs } from '@/presentation/components/shared/DateRangeInputs'
import { getLocalDateIso } from '@sadhana-connect/shared'

describe('DateRangeInputs', () => {
  it('renders the given from/to values', () => {
    render(
      <DateRangeInputs
        idPrefix="test"
        fromDate="2026-01-01"
        toDate="2026-01-15"
        onFromDateChange={vi.fn()}
        onToDateChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('From')).toHaveValue('2026-01-01')
    expect(screen.getByLabelText('To')).toHaveValue('2026-01-15')
  })

  it('caps both inputs at local today', () => {
    render(
      <DateRangeInputs
        idPrefix="test"
        fromDate=""
        toDate=""
        onFromDateChange={vi.fn()}
        onToDateChange={vi.fn()}
      />,
    )

    const today = getLocalDateIso()
    expect(screen.getByLabelText('From')).toHaveAttribute('max', today)
    expect(screen.getByLabelText('To')).toHaveAttribute('max', today)
  })

  it('uses idPrefix to keep input ids unique', () => {
    render(
      <DateRangeInputs
        idPrefix="unique-prefix"
        fromDate=""
        toDate=""
        onFromDateChange={vi.fn()}
        onToDateChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('From')).toHaveAttribute(
      'id',
      'unique-prefix-from-date',
    )
    expect(screen.getByLabelText('To')).toHaveAttribute(
      'id',
      'unique-prefix-to-date',
    )
  })

  it('calls onFromDateChange when the From input changes', async () => {
    const onFromDateChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DateRangeInputs
        idPrefix="test"
        fromDate=""
        toDate=""
        onFromDateChange={onFromDateChange}
        onToDateChange={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('From'), '2026-01-05')

    expect(onFromDateChange).toHaveBeenCalled()
  })

  it('calls onToDateChange when the To input changes', async () => {
    const onToDateChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DateRangeInputs
        idPrefix="test"
        fromDate=""
        toDate=""
        onFromDateChange={vi.fn()}
        onToDateChange={onToDateChange}
      />,
    )

    await user.type(screen.getByLabelText('To'), '2026-01-20')

    expect(onToDateChange).toHaveBeenCalled()
  })
})
