import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildWhatsAppShareUrl } from '@sadhana-connect/sadhana'
import type { SadhanaReport } from '@sadhana-connect/domain'
import { SadhanaReportSummaryRow } from '@/presentation/pages/sadhana/SadhanaReportSummaryRow'

const { useSadhanaReportCommentsMock } = vi.hoisted(() => ({
  useSadhanaReportCommentsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/comments', () => ({
  useSadhanaReportComments: useSadhanaReportCommentsMock,
}))

const baseReport: SadhanaReport = {
  id: 'report-1',
  profileId: 'user-1',
  reportDate: '2026-01-15',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: null,
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
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

function renderRow(
  props: Partial<ComponentProps<typeof SadhanaReportSummaryRow>>,
) {
  return render(
    <MemoryRouter>
      <SadhanaReportSummaryRow report={baseReport} {...props} />
    </MemoryRouter>,
  )
}

describe('SadhanaReportSummaryRow', () => {
  beforeEach(() => {
    useSadhanaReportCommentsMock.mockReset()
  })

  it('links to the dated Sadhana page', () => {
    renderRow({})

    expect(screen.getByRole('link', { name: /15 January 2026/ })).toHaveAttribute(
      'href',
      '/sadhana?date=2026-01-15',
    )
  })

  it('renders a Share to WhatsApp link with the correct href, target, and rel', () => {
    renderRow({})

    const shareLink = screen.getByRole('link', { name: 'Share to WhatsApp' })
    expect(shareLink).toHaveAttribute('href', buildWhatsAppShareUrl(baseReport))
    expect(shareLink).toHaveAttribute('target', '_blank')
    expect(shareLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the Share to WhatsApp link in both the compact and detailed variants', () => {
    renderRow({ variant: 'compact' })
    expect(screen.getByRole('link', { name: 'Share to WhatsApp' })).toBeInTheDocument()
  })

  it('does not render Export PDF or Export Text when no export callbacks are provided', () => {
    renderRow({})

    expect(screen.queryByRole('button', { name: 'Export PDF' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Export Text' })).not.toBeInTheDocument()
  })

  it('renders Export PDF only when onExportPdf is provided, and calls it with the report', async () => {
    const onExportPdf = vi.fn()
    const user = userEvent.setup()
    renderRow({ onExportPdf })

    expect(screen.queryByRole('button', { name: 'Export Text' })).not.toBeInTheDocument()
    const exportPdfButton = screen.getByRole('button', { name: 'Export PDF' })
    await user.click(exportPdfButton)

    expect(onExportPdf).toHaveBeenCalledWith(baseReport)
  })

  it('renders Export Text only when onExportText is provided, and calls it with the report', async () => {
    const onExportText = vi.fn()
    const user = userEvent.setup()
    renderRow({ onExportText })

    expect(screen.queryByRole('button', { name: 'Export PDF' })).not.toBeInTheDocument()
    const exportTextButton = screen.getByRole('button', { name: 'Export Text' })
    await user.click(exportTextButton)

    expect(onExportText).toHaveBeenCalledWith(baseReport)
  })

  it('renders both export actions in the compact variant when provided', () => {
    renderRow({ variant: 'compact', onExportPdf: vi.fn(), onExportText: vi.fn() })

    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export Text' })).toBeInTheDocument()
  })

  it('shows the formatted date', () => {
    renderRow({})

    expect(screen.getByText('15 January 2026')).toBeInTheDocument()
  })

  it('compact variant shows only total rounds', () => {
    renderRow({ variant: 'compact' })

    expect(screen.getByText('16 rounds')).toBeInTheDocument()
    expect(screen.queryByText(/reading/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/PM/)).not.toBeInTheDocument()
  })

  it('detailed variant shows rounds, reading, hearing, and sleep/wake', () => {
    renderRow({ variant: 'detailed' })

    expect(
      screen.getByText('16 rounds · 15m reading · 30m hearing'),
    ).toBeInTheDocument()
    expect(screen.getByText('10:00 PM → 4:00 AM')).toBeInTheDocument()
  })

  it('detailed variant omits the sleep/wake line when neither is present', () => {
    renderRow({
      variant: 'detailed',
      report: { ...baseReport, sleepTime: null, wakeTime: null },
    })

    expect(screen.queryByText(/→/)).not.toBeInTheDocument()
  })

  it('defaults to the detailed variant', () => {
    renderRow({})

    expect(
      screen.getByText('16 rounds · 15m reading · 30m hearing'),
    ).toBeInTheDocument()
  })

  it('does not fetch comments until the comments toggle is expanded', () => {
    renderRow({})

    expect(useSadhanaReportCommentsMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /show mentor comments/i })).toBeInTheDocument()
  })

  it('expands to show the read-only comment thread when toggled, without leaving the page', async () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
    const user = userEvent.setup()

    renderRow({})
    await user.click(screen.getByRole('button', { name: /show mentor comments/i }))

    expect(screen.getByText('No mentor comments yet.')).toBeInTheDocument()
    // Still exactly the date/report link and the Share to WhatsApp link —
    // the comments toggle is a button, not a third navigable link.
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('never renders any input, textarea, or button that could write a comment — devotees are read-only', async () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'c1',
          sadhanaReportId: 'report-1',
          mentorId: 'mentor-1',
          mentorName: 'Mentor One',
          commentText: 'Well done!',
          createdAt: '2026-01-15T00:00:00.000Z',
          updatedAt: '2026-01-15T00:00:00.000Z',
        },
      ],
    })
    const user = userEvent.setup()

    renderRow({})
    await user.click(screen.getByRole('button', { name: /show mentor comments/i }))

    expect(screen.getByText('Well done!')).toBeInTheDocument()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /post/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })
})
