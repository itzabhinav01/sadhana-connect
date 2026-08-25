import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SadhanaReport } from '@sadhana-connect/domain'
import { MentorDevoteeReportRow } from '@/presentation/pages/mentor/MentorDevoteeReportRow'

const { useAuthMock, useProfileMock, useSadhanaReportCommentsMock, useAddCommentMock } =
  vi.hoisted(() => ({
    useAuthMock: vi.fn(),
    useProfileMock: vi.fn(),
    useSadhanaReportCommentsMock: vi.fn(),
    useAddCommentMock: vi.fn(),
  }))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
  useProfile: useProfileMock,
}))
vi.mock('@sadhana-connect/comments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/comments')>()
  return {
    ...actual,
    useSadhanaReportComments: useSadhanaReportCommentsMock,
    useAddComment: useAddCommentMock,
    useUpdateComment: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteComment: () => ({ mutate: vi.fn(), isPending: false }),
  }
})

const report: SadhanaReport = {
  id: 'r1',
  profileId: 'd1',
  reportDate: '2026-01-15',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: '08:00',
  totalRounds: 16,
  readingMinutes: 20,
  bookName: null,
  hearingMinutes: 30,
  speakerName: null,
  sleepTime: null,
  wakeTime: null,
  dayRestMinutes: 0,
  totalRestMinutes: 0,
  officeGoingTime: null,
  officeReturnTime: null,
  notes: null,
  signatureText: 'Devotee One',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('MentorDevoteeReportRow', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useProfileMock.mockReset()
    useSadhanaReportCommentsMock.mockReset()
    useAddCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'mentor-1', fullName: 'Mentor One', role: 'mentor', templeGroupId: null, isActive: true },
    })
    useAddCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  })

  it('displays the date, rounds, reading, and hearing minutes', () => {
    render(<MentorDevoteeReportRow report={report} />)

    expect(screen.getByText('01/15/2026')).toBeInTheDocument()
    expect(screen.getByText(/16 rounds/)).toBeInTheDocument()
    expect(screen.getByText(/20m reading/)).toBeInTheDocument()
    expect(screen.getByText(/30m hearing/)).toBeInTheDocument()
  })

  it('is not a link — never navigates to the editable Sadhana form', () => {
    render(<MentorDevoteeReportRow report={report} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('never shows a Share to WhatsApp action — sharing is devotee-only (Phase 15)', () => {
    render(<MentorDevoteeReportRow report={report} />)

    expect(
      screen.queryByRole('link', { name: /share to whatsapp/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/share to whatsapp/i)).not.toBeInTheDocument()
  })

  it('never shows Export PDF or Export Text — export is devotee-only (Phase 16)', () => {
    render(<MentorDevoteeReportRow report={report} />)

    expect(screen.queryByRole('button', { name: 'Export PDF' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Export Text' })).not.toBeInTheDocument()
  })

  it('does not fetch comments until the comments toggle is expanded', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    render(<MentorDevoteeReportRow report={report} />)

    // The lazy-load hook is only invoked (rendered) once expanded — the
    // collapsed row doesn't mount MentorReportCommentSection at all.
    expect(screen.queryByText('No comments yet.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show comments/i })).toBeInTheDocument()
  })

  it('expands to show the comment thread and form when the toggle is clicked', async () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
    const user = userEvent.setup()

    render(<MentorDevoteeReportRow report={report} />)

    await user.click(screen.getByRole('button', { name: /show comments/i }))

    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
    expect(screen.getByLabelText('Add a comment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hide comments/i })).toBeInTheDocument()
  })
})
