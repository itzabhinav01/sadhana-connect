import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SadhanaFormPage } from '@/presentation/pages/sadhana/SadhanaFormPage'

const { useSadhanaReportMock } = vi.hoisted(() => ({
  useSadhanaReportMock: vi.fn(),
}))

vi.mock('@/application/sadhana/use-sadhana-report', () => ({
  useSadhanaReport: useSadhanaReportMock,
}))

vi.mock('@/application/sadhana/use-upsert-sadhana-report', () => ({
  useUpsertSadhanaReport: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}))

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

    render(<SadhanaFormPage />)

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

    render(<SadhanaFormPage />)

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

    render(<SadhanaFormPage />)

    expect(
      screen.getByRole('button', { name: /save sadhana/i }),
    ).toBeInTheDocument()
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

    render(<SadhanaFormPage />)

    expect(
      screen.getByRole('button', { name: /update sadhana/i }),
    ).toBeInTheDocument()
  })
})
