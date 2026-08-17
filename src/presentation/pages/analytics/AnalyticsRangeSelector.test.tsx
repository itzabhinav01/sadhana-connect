import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AnalyticsRangeSelector } from '@/presentation/pages/analytics/AnalyticsRangeSelector'

describe('AnalyticsRangeSelector', () => {
  it('renders the four range options', () => {
    render(
      <AnalyticsRangeSelector
        option="7"
        customRange={{ fromDate: '', toDate: '' }}
        error={null}
        onOptionChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /last 7 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /last 30 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /last 90 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument()
  })

  it('marks the active option as pressed', () => {
    render(
      <AnalyticsRangeSelector
        option="30"
        customRange={{ fromDate: '', toDate: '' }}
        error={null}
        onOptionChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: /last 30 days/i }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /last 7 days/i }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onOptionChange when a quick option is clicked', async () => {
    const onOptionChange = vi.fn()
    const user = userEvent.setup()
    render(
      <AnalyticsRangeSelector
        option="7"
        customRange={{ fromDate: '', toDate: '' }}
        error={null}
        onOptionChange={onOptionChange}
        onCustomRangeChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /last 90 days/i }))

    expect(onOptionChange).toHaveBeenCalledWith('90')
  })

  it('does not show date inputs unless "Custom" is selected', () => {
    render(
      <AnalyticsRangeSelector
        option="7"
        customRange={{ fromDate: '', toDate: '' }}
        error={null}
        onOptionChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
  })

  it('shows date inputs when "Custom" is selected', () => {
    render(
      <AnalyticsRangeSelector
        option="custom"
        customRange={{ fromDate: '2026-01-01', toDate: '2026-01-15' }}
        error={null}
        onOptionChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('From')).toHaveValue('2026-01-01')
    expect(screen.getByLabelText('To')).toHaveValue('2026-01-15')
  })

  it('calls onCustomRangeChange when a custom date is edited', async () => {
    const onCustomRangeChange = vi.fn()
    const user = userEvent.setup()
    render(
      <AnalyticsRangeSelector
        option="custom"
        customRange={{ fromDate: '', toDate: '' }}
        error={null}
        onOptionChange={vi.fn()}
        onCustomRangeChange={onCustomRangeChange}
      />,
    )

    await user.type(screen.getByLabelText('From'), '2026-01-05')

    expect(onCustomRangeChange).toHaveBeenCalled()
  })

  it('shows the validation error message when provided', () => {
    render(
      <AnalyticsRangeSelector
        option="custom"
        customRange={{ fromDate: '2026-01-16', toDate: '2026-01-15' }}
        error="From date must be before To date."
        onOptionChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'From date must be before To date.',
    )
  })

  it('shows no error message when error is null', () => {
    render(
      <AnalyticsRangeSelector
        option="7"
        customRange={{ fromDate: '', toDate: '' }}
        error={null}
        onOptionChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
