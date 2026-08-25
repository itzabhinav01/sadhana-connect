import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SadhanaFormPage } from '@/presentation/pages/sadhana/SadhanaFormPage'

const { useSadhanaReportMock } = vi.hoisted(() => ({
  useSadhanaReportMock: vi.fn(),
}))

vi.mock('@sadhana-connect/sadhana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/sadhana')>()
  return {
    ...actual,
    useSadhanaReport: useSadhanaReportMock,
    useUpsertSadhanaReport: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    }),
  }
})

function renderPage(initialPath = '/sadhana') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SadhanaFormPage />
    </MemoryRouter>,
  )
}

describe('SadhanaFormPage', () => {
  beforeEach(() => {
    useSadhanaReportMock.mockReset()
  })

  it('shows a loading state while the report is resolving', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /save sadhana/i }),
    ).not.toBeInTheDocument()
  })

  it('shows an error state when the report fails to load', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /save sadhana/i }),
    ).not.toBeInTheDocument()
  })

  it('renders an empty form for a date with no report yet', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderPage()

    expect(
      screen.getByRole('button', { name: /save sadhana/i }),
    ).toBeInTheDocument()
  })

  it('reads the initial date from a ?date= URL param', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderPage('/sadhana?date=2026-01-15')

    expect(useSadhanaReportMock).toHaveBeenCalledWith('2026-01-15')
  })

  it('falls back to today for an invalid ?date= param', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderPage('/sadhana?date=not-a-date')

    expect(useSadhanaReportMock).not.toHaveBeenCalledWith('not-a-date')
  })

  it('reads ?prefillRounds= and applies it to the Total Rounds field', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderPage('/sadhana?date=2026-01-15&prefillRounds=12')

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('12')
  })

  it('ignores an invalid ?prefillRounds= param', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    renderPage('/sadhana?date=2026-01-15&prefillRounds=not-a-number')

    expect(screen.getByLabelText(/^total rounds$/i)).toHaveValue('')
  })

  it('renders a prefilled form for a date with an existing report', () => {
    useSadhanaReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'report-1',
        profileId: 'user-1',
        reportDate: '2026-01-15',
        roundsBefore430: 4,
        roundsTill7am: 8,
        lastRoundTime: null,
        totalRounds: 12,
        readingMinutes: 0,
        bookName: null,
        hearingMinutes: 0,
        speakerName: null,
        sleepTime: null,
        wakeTime: null,
        dayRestMinutes: 0,
        totalRestMinutes: 0,
        officeGoingTime: null,
        officeReturnTime: null,
        notes: null,
        signatureText: 'Test Devotee',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
    })

    renderPage()

    expect(
      screen.getByRole('button', { name: /update sadhana/i }),
    ).toBeInTheDocument()
  })
})
