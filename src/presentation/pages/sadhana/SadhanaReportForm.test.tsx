import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { SadhanaReportForm } from '@/presentation/pages/sadhana/SadhanaReportForm'

const { mutateMock, useUpsertSadhanaReportMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  useUpsertSadhanaReportMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-upsert-sadhana-report', () => ({
  useUpsertSadhanaReport: useUpsertSadhanaReportMock,
}))

const existingReport: SadhanaReport = {
  id: 'report-1',
  profileId: 'user-1',
  reportDate: '2026-01-15',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: '06:45',
  totalRounds: 16,
  readingMinutes: 15,
  bookName: 'Bhagavad Gita',
  hearingMinutes: 30,
  speakerName: 'HG Devotee Prabhu',
  sleepTime: '22:00',
  wakeTime: '03:30',
  dayRestMinutes: 20,
  totalRestMinutes: 360,
  officeGoingTime: '09:00',
  officeReturnTime: '18:00',
  notes: 'Good day',
  signatureText: 'Test Devotee',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('SadhanaReportForm', () => {
  beforeEach(() => {
    mutateMock.mockReset()
    useUpsertSadhanaReportMock.mockReset()
    useUpsertSadhanaReportMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: false,
      isSuccess: false,
    })
  })

  it('renders an empty form with "Save Sadhana" when there is no existing report', () => {
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: /save sadhana/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/rounds before 4:30 am/i)).toHaveValue('')
  })

  it('renders a prefilled form with "Update Sadhana" for an existing report', () => {
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={existingReport}
        onDateChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: /update sadhana/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/rounds before 4:30 am/i)).toHaveValue('4')
    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('16')
    expect(screen.getByLabelText(/book name/i)).toHaveValue('Bhagavad Gita')
    expect(screen.getByLabelText(/^signature$/i)).toHaveValue('Test Devotee')
  })

  it('auto-suggests Total Rounds from the two period fields on a new report', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText(/rounds before 4:30 am/i), '4')
    await user.type(screen.getByLabelText(/rounds till 7 am/i), '8')

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('12')
  })

  it('stops auto-suggesting Total Rounds once the user edits it directly', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText(/rounds before 4:30 am/i), '4')
    await user.type(screen.getByLabelText(/rounds till 7 am/i), '8')
    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('12')

    const totalRoundsInput = screen.getByLabelText(/^total rounds$/i)
    await user.clear(totalRoundsInput)
    await user.type(totalRoundsInput, '99')
    expect(totalRoundsInput).toHaveValue('99')

    // Further edits to the period fields must never override the
    // devotee's own Total Rounds value once they've touched it.
    await user.type(screen.getByLabelText(/rounds before 4:30 am/i), '1')
    expect(totalRoundsInput).toHaveValue('99')
  })

  it('never auto-overwrites Total Rounds when editing an existing report', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={existingReport}
        onDateChange={vi.fn()}
      />,
    )

    const beforeInput = screen.getByLabelText(/rounds before 4:30 am/i)
    await user.clear(beforeInput)
    await user.type(beforeInput, '1')

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('16')
  })

  it('allows independently mismatched rest fields without validation error', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText(/day rest/i), '500')
    await user.type(screen.getByLabelText(/total rest/i), '1')
    await user.type(screen.getByLabelText(/^signature$/i), 'Test Devotee')
    await user.click(screen.getByRole('button', { name: /save sadhana/i }))

    expect(mutateMock).toHaveBeenCalled()
    const [params] = mutateMock.mock.calls[0]
    expect(params.dayRestMinutes).toBe(500)
    expect(params.totalRestMinutes).toBe(1)
  })

  it('requires a signature before submitting', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /save sadhana/i }))

    expect(
      await screen.findByText(/signature is required/i),
    ).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('submits mapped upsert params on save', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText(/^signature$/i), 'Test Devotee')
    await user.click(screen.getByRole('button', { name: /save sadhana/i }))

    expect(mutateMock).toHaveBeenCalledTimes(1)
    const [params] = mutateMock.mock.calls[0]
    expect(params.reportDate).toBe('2026-01-15')
    expect(params.signatureText).toBe('Test Devotee')
    expect(params.roundsBefore430).toBe(0)
    expect(params.bookName).toBeNull()
  })

  it('shows a generic error message on save failure without leaking backend details', () => {
    useUpsertSadhanaReportMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: true,
      isSuccess: false,
    })

    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.queryByText(/row-level security|RLS|postgres/i)).toBeNull()
  })

  it('shows a confirmation once the report has saved', () => {
    useUpsertSadhanaReportMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: false,
      isSuccess: true,
    })

    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/report saved/i)).toBeInTheDocument()
  })
})
