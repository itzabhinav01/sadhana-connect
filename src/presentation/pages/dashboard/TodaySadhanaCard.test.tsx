import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildWhatsAppShareUrl } from '@/application/sadhana/format-sadhana-report-for-whatsapp'
import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import { TodaySadhanaCard } from '@/presentation/pages/dashboard/TodaySadhanaCard'

const todaysReport: SadhanaReport = {
  id: 'report-1',
  profileId: 'user-1',
  reportDate: '2026-08-19',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: '06:30',
  totalRounds: 16,
  readingMinutes: 15,
  bookName: null,
  hearingMinutes: 30,
  speakerName: null,
  sleepTime: '22:00',
  wakeTime: '04:00',
  dayRestMinutes: 0,
  totalRestMinutes: 0,
  officeGoingTime: null,
  officeReturnTime: null,
  notes: null,
  signatureText: 'Test Devotee',
  createdAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-08-19T00:00:00.000Z',
}

const { useSadhanaReportMock, useSadhanaStreakMock } = vi.hoisted(() => ({
  useSadhanaReportMock: vi.fn(),
  useSadhanaStreakMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-report', () => ({
  useSadhanaReport: useSadhanaReportMock,
}))

vi.mock('@/application/sadhana/use-sadhana-streak', () => ({
  useSadhanaStreak: useSadhanaStreakMock,
}))

function renderCard() {
  return render(
    <MemoryRouter>
      <TodaySadhanaCard />
    </MemoryRouter>,
  )
}

describe('TodaySadhanaCard', () => {
  beforeEach(() => {
    useSadhanaReportMock.mockReset()
    useSadhanaStreakMock.mockReset()
    useSadhanaStreakMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: 3,
    })
  })

  it('shows a loading state', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    renderCard()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    renderCard()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows "not completed" and a Fill Sadhana CTA when there is no report today', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderCard()

    expect(
      screen.getByText(/haven't logged today's sadhana yet/i),
    ).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /fill sadhana/i })
    expect(cta).toHaveAttribute('href', '/sadhana')
  })

  it('shows completion status, metrics, and an Edit Sadhana CTA when a report exists', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: todaysReport,
    })

    renderCard()

    expect(screen.getByText(/is saved/i)).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText('15 min')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /edit sadhana/i })
    expect(cta).toHaveAttribute('href', '/sadhana')
  })

  it('shows a Share to WhatsApp link with the correct href, target, and rel when a report exists', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: todaysReport,
    })

    renderCard()

    const shareLink = screen.getByRole('link', { name: 'Share to WhatsApp' })
    expect(shareLink).toHaveAttribute('href', buildWhatsAppShareUrl(todaysReport))
    expect(shareLink).toHaveAttribute('target', '_blank')
    expect(shareLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not show a Share to WhatsApp link when there is no report today', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderCard()

    expect(
      screen.queryByRole('link', { name: 'Share to WhatsApp' }),
    ).not.toBeInTheDocument()
  })

  it('shows the current streak', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })
    useSadhanaStreakMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: 5,
    })

    renderCard()

    expect(screen.getByText(/current streak: 5 days/i)).toBeInTheDocument()
  })
})
