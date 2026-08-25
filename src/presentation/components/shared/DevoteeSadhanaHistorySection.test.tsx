import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLastNDaysRange } from '@sadhana-connect/sadhana'
import { buildDateRangeList } from '@sadhana-connect/shared'
import { DevoteeSadhanaHistorySection } from '@/presentation/components/shared/DevoteeSadhanaHistorySection'

const { useDevoteeReportHistoryMock, useSendReminderMock } = vi.hoisted(() => ({
  useDevoteeReportHistoryMock: vi.fn(),
  useSendReminderMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-devotee-report-history', () => ({
  useDevoteeReportHistory: useDevoteeReportHistoryMock,
}))
vi.mock('@/application/notifications/use-send-reminder', async () => {
  const actual = await vi.importActual<
    typeof import('@/application/notifications/use-send-reminder')
  >('@/application/notifications/use-send-reminder')
  return { ...actual, useSendReminder: useSendReminderMock }
})

describe('DevoteeSadhanaHistorySection', () => {
  beforeEach(() => {
    useDevoteeReportHistoryMock.mockReset()
    useSendReminderMock.mockReset()
    useSendReminderMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })
  })

  it('defaults to "Last 1 week" and shows every day filled when no gaps exist', () => {
    const range = getLastNDaysRange(7)
    const allDates = buildDateRangeList(range.fromDate, range.toDate)
    useDevoteeReportHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: allDates.map((reportDate, i) => ({
        id: `r${i}`,
        reportDate,
        totalRounds: 16,
        readingMinutes: 10,
        hearingMinutes: 10,
      })),
    })

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />)

    expect(screen.getByRole('button', { name: 'Last 1 week' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(`All ${allDates.length} days filled in this range.`)).toBeInTheDocument()
  })

  it('lists the missed dates when some days in the range have no report', () => {
    const range = getLastNDaysRange(7)
    const allDates = buildDateRangeList(range.fromDate, range.toDate)
    // Keep only the first and last day — everything in between is missed.
    const filled = [allDates[0], allDates[allDates.length - 1]]
    useDevoteeReportHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: filled.map((reportDate, i) => ({
        id: `r${i}`,
        reportDate,
        totalRounds: 16,
        readingMinutes: 10,
        hearingMinutes: 10,
      })),
    })

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />)

    expect(
      screen.getByText(new RegExp(`Missed ${allDates.length - 2} of ${allDates.length} days`)),
    ).toBeInTheDocument()
  })

  it('switches to "Last 2 weeks" and re-queries the wider range', async () => {
    useDevoteeReportHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
    const user = userEvent.setup()
    const expected = getLastNDaysRange(14)

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />)
    await user.click(screen.getByRole('button', { name: 'Last 2 weeks' }))

    expect(useDevoteeReportHistoryMock).toHaveBeenCalledWith(
      'devotee-1',
      expected.fromDate,
      expected.toDate,
      expect.anything(),
    )
  })

  it('shows the custom date inputs only when "Custom" is selected', async () => {
    useDevoteeReportHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
    const user = userEvent.setup()

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />)
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    expect(screen.getByLabelText('From')).toBeInTheDocument()
    expect(screen.getByLabelText('To')).toBeInTheDocument()
  })

  it('always renders the Send a reminder form regardless of range/history state', () => {
    useDevoteeReportHistoryMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />)

    expect(screen.getByText('Send a reminder')).toBeInTheDocument()
  })
})
