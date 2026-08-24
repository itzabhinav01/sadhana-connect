import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'
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

  // Data-model correction: roundsBefore430, roundsTill7am, and
  // totalRounds are completely independent (a devotee may chant
  // additional rounds after 7 AM that the sheet does not separately
  // time-track, so Total Rounds is the authoritative daily total and is
  // never derived from, or validated against, the other two). This form
  // previously auto-suggested Total Rounds as before + till while
  // editing a fresh report; that behavior has been removed entirely.
  it('never derives Total Rounds from Rounds before 4:30 AM + Rounds till 7 AM on a new report', async () => {
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

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('')
  })

  it.each([
    ['16', 'more rounds were chanted after 7 AM than the two tracked periods sum to'],
    ['12', 'Total Rounds happens to equal the sum of the two tracked periods'],
    ['8', 'Total Rounds is less than the sum of the two tracked periods'],
  ])(
    'accepts Total Rounds = %s independently of Before(4) + Till(8) — %s',
    async (totalRoundsValue) => {
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
      await user.type(screen.getByLabelText(/^total rounds$/i), totalRoundsValue)
      await user.type(screen.getByLabelText(/^signature$/i), 'Test Devotee')
      await user.click(screen.getByRole('button', { name: /save sadhana/i }))

      expect(mutateMock).toHaveBeenCalledTimes(1)
      const [params] = mutateMock.mock.calls[0]
      expect(params.roundsBefore430).toBe(4)
      expect(params.roundsTill7am).toBe(8)
      expect(params.totalRounds).toBe(Number(totalRoundsValue))
    },
  )

  it('changing Rounds before 4:30 AM or Rounds till 7 AM never changes an already-entered Total Rounds', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
      />,
    )

    const totalRoundsInput = screen.getByLabelText(/^total rounds$/i)
    await user.type(totalRoundsInput, '5')

    await user.type(screen.getByLabelText(/rounds before 4:30 am/i), '4')
    expect(totalRoundsInput).toHaveValue('5')

    await user.type(screen.getByLabelText(/rounds till 7 am/i), '8')
    expect(totalRoundsInput).toHaveValue('5')
  })

  it('changing Total Rounds never changes Rounds before 4:30 AM or Rounds till 7 AM', async () => {
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
    await user.type(screen.getByLabelText(/^total rounds$/i), '99')

    expect(screen.getByLabelText(/rounds before 4:30 am/i)).toHaveValue('4')
    expect(screen.getByLabelText(/rounds till 7 am/i)).toHaveValue('8')
  })

  it('has no cross-field validation between the rounds fields — a mismatched combination still saves', async () => {
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
    // Deliberately far lower than before + till (12) — must still be
    // accepted, since the fields are unrelated.
    await user.type(screen.getByLabelText(/^total rounds$/i), '1')
    await user.type(screen.getByLabelText(/^signature$/i), 'Test Devotee')
    await user.click(screen.getByRole('button', { name: /save sadhana/i }))

    expect(
      screen.queryByText(/total rounds must (be|equal|match|at least)/i),
    ).not.toBeInTheDocument()
    expect(mutateMock).toHaveBeenCalledTimes(1)
    const [params] = mutateMock.mock.calls[0]
    expect(params.totalRounds).toBe(1)
  })

  it('retains an existing report’s stored Total Rounds unchanged when its period fields are edited', async () => {
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

  it('prefills Total Rounds from prefillRounds on a fresh (no existing) report', () => {
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
        prefillRounds={12}
      />,
    )

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('12')
  })

  it('prefillRounds overrides an existing report\'s stored Total Rounds', () => {
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={existingReport}
        onDateChange={vi.fn()}
        prefillRounds={20}
      />,
    )

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('20')
  })

  it('editing the period fields after a prefillRounds value is set never changes Total Rounds', async () => {
    const user = userEvent.setup()
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
        prefillRounds={12}
      />,
    )

    await user.type(screen.getByLabelText(/rounds before 4:30 am/i), '4')
    await user.type(screen.getByLabelText(/rounds till 7 am/i), '8')

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('12')
  })

  it('does not auto-submit when prefillRounds is present — still requires a manual save', () => {
    render(
      <SadhanaReportForm
        date="2026-01-15"
        existingReport={null}
        onDateChange={vi.fn()}
        prefillRounds={12}
      />,
    )

    expect(mutateMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: /save sadhana/i }),
    ).toBeInTheDocument()
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
