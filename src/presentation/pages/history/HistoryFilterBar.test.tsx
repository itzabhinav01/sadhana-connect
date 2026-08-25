import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HistoryFilterBar } from '@/presentation/pages/history/HistoryFilterBar'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'

describe('HistoryFilterBar', () => {
  it('renders the current from/to values', () => {
    render(
      <HistoryFilterBar
        filters={{ fromDate: '2026-01-01', toDate: '2026-01-15' }}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('From')).toHaveValue('2026-01-01')
    expect(screen.getByLabelText('To')).toHaveValue('2026-01-15')
  })

  it('caps both date inputs at local today', () => {
    render(
      <HistoryFilterBar filters={{ fromDate: '', toDate: '' }} onChange={vi.fn()} />,
    )

    const today = getLocalDateIso()
    expect(screen.getByLabelText('From')).toHaveAttribute('max', today)
    expect(screen.getByLabelText('To')).toHaveAttribute('max', today)
  })

  it('"Last 30 days" sets fromDate to 29 days ago and clears toDate', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <HistoryFilterBar filters={{ fromDate: '', toDate: '' }} onChange={onChange} />,
    )

    await user.click(screen.getByRole('button', { name: /last 30 days/i }))

    const today = getLocalDateIso()
    expect(onChange).toHaveBeenCalledWith({
      fromDate: addDaysIso(today, -29),
      toDate: '',
    })
  })

  it('"Last 90 days" sets fromDate to 89 days ago', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <HistoryFilterBar filters={{ fromDate: '', toDate: '' }} onChange={onChange} />,
    )

    await user.click(screen.getByRole('button', { name: /last 90 days/i }))

    const today = getLocalDateIso()
    expect(onChange).toHaveBeenCalledWith({
      fromDate: addDaysIso(today, -89),
      toDate: '',
    })
  })

  it('"All time" clears both bounds (no lower bound; upper bound stays local today via the hook)', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <HistoryFilterBar
        filters={{ fromDate: '2026-01-01', toDate: '2026-01-15' }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /all time/i }))

    expect(onChange).toHaveBeenCalledWith({ fromDate: '', toDate: '' })
  })

  it('calls onChange when the From date is edited directly', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <HistoryFilterBar filters={{ fromDate: '', toDate: '' }} onChange={onChange} />,
    )

    await user.type(screen.getByLabelText('From'), '2026-01-05')

    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls.at(-1)?.[0]
    expect(lastCall.fromDate).toBe('2026-01-05')
  })
})
