import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLastNDaysRange } from '@sadhana-connect/sadhana'
import { buildDateRangeList } from '@sadhana-connect/shared'
import { DevoteeSadhanaHistorySection } from '@/presentation/components/shared/DevoteeSadhanaHistorySection'

const { useDevoteeReportHistoryMock, useSendReminderMock, useAuthMock, listFullReportsInRangeMock } =
  vi.hoisted(() => ({
    useDevoteeReportHistoryMock: vi.fn(),
    useSendReminderMock: vi.fn(),
    useAuthMock: vi.fn(),
    listFullReportsInRangeMock: vi.fn(),
  }))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseSadhanaReportRepository: {
    listFullReportsInRange: listFullReportsInRangeMock,
  },
}))

vi.mock('@sadhana-connect/sadhana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/sadhana')>()
  return {
    ...actual,
    useDevoteeReportHistory: useDevoteeReportHistoryMock,
  }
})

vi.mock('@sadhana-connect/notifications', async () => {
  const actual = await vi.importActual<
    typeof import('@sadhana-connect/notifications')
  >('@sadhana-connect/notifications')
  return { ...actual, useSendReminder: useSendReminderMock }
})

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('DevoteeSadhanaHistorySection', () => {
  beforeEach(() => {
    useDevoteeReportHistoryMock.mockReset()
    useSendReminderMock.mockReset()
    useAuthMock.mockReset()
    listFullReportsInRangeMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'mentor@example.com', emailConfirmedAt: null },
      isLoading: false,
    })
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

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />, { wrapper: createWrapper() })

    expect(screen.getByRole('button', { name: 'Last 1 week' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(`All ${allDates.length} days filled in this range.`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preview PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument()
  })

  it('lists the missed dates when some days in the range have no report', () => {
    const range = getLastNDaysRange(7)
    const allDates = buildDateRangeList(range.fromDate, range.toDate)
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

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />, { wrapper: createWrapper() })

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

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />, { wrapper: createWrapper() })
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

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />, { wrapper: createWrapper() })
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    expect(screen.getByLabelText('From')).toBeInTheDocument()
    expect(screen.getByLabelText('To')).toBeInTheDocument()
  })

  it('opens the in-app preview modal when "Preview PDF" is clicked', async () => {
    useDevoteeReportHistoryMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
    listFullReportsInRangeMock.mockResolvedValue([
      {
        id: 'r1',
        profileId: 'devotee-1',
        reportDate: '2026-01-05',
        roundsBefore430: 4,
        roundsTill7am: 8,
        lastRoundTime: '06:45',
        totalRounds: 16,
        readingMinutes: 15,
        bookName: 'Bhagavad-gītā',
        hearingMinutes: 30,
        speakerName: 'HG Prabhu',
        sleepTime: '22:00',
        wakeTime: '04:00',
        dayRestMinutes: 0,
        totalRestMinutes: 0,
        officeGoingTime: null,
        officeReturnTime: null,
        notes: null,
        signatureText: 'Devotee Dasa',
        createdAt: '2026-01-05T00:00:00Z',
        updatedAt: '2026-01-05T00:00:00Z',
      },
    ])
    const user = userEvent.setup()

    render(
      <DevoteeSadhanaHistorySection devoteeId="devotee-1" devoteeName="Devotee Dasa" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByRole('button', { name: 'Preview PDF' }))

    expect(screen.getByText('Sadhana Report Preview')).toBeInTheDocument()
    expect(screen.getAllByText(/Devotee Dasa/).length).toBeGreaterThan(0)
    expect(screen.getByText('Bhagavad-gītā')).toBeInTheDocument()
  })

  it('always renders the Send a reminder form regardless of range/history state', () => {
    useDevoteeReportHistoryMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    render(<DevoteeSadhanaHistorySection devoteeId="devotee-1" />, { wrapper: createWrapper() })

    expect(screen.getByText('Send a reminder')).toBeInTheDocument()
  })
})
