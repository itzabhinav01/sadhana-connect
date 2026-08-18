import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SadhanaReportComments } from '@/presentation/pages/sadhana/SadhanaReportComments'

const { useSadhanaReportCommentsMock } = vi.hoisted(() => ({
  useSadhanaReportCommentsMock: vi.fn(),
}))

vi.mock('@/application/comments/use-sadhana-report-comments', () => ({
  useSadhanaReportComments: useSadhanaReportCommentsMock,
}))

describe('SadhanaReportComments', () => {
  beforeEach(() => {
    useSadhanaReportCommentsMock.mockReset()
  })

  it('shows a loading state while pending', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    render(<SadhanaReportComments sadhanaReportId="r1" />)

    expect(screen.getByText(/loading comments/i)).toBeInTheDocument()
  })

  it('shows an error state on failure', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    render(<SadhanaReportComments sadhanaReportId="r1" />)

    expect(screen.getByText(/something went wrong loading comments/i)).toBeInTheDocument()
  })

  it('shows an empty state when there are no comments', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    render(<SadhanaReportComments sadhanaReportId="r1" />)

    expect(screen.getByText('No mentor comments yet.')).toBeInTheDocument()
  })

  it("renders each comment's mentor name, text, and timestamp", () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'c1',
          sadhanaReportId: 'r1',
          mentorId: 'mentor-1',
          mentorName: 'Mentor One',
          commentText: 'Great effort this week.',
          createdAt: '2026-01-15T10:00:00.000Z',
          updatedAt: '2026-01-15T10:00:00.000Z',
        },
      ],
    })

    render(<SadhanaReportComments sadhanaReportId="r1" />)

    expect(screen.getByText('Mentor One')).toBeInTheDocument()
    expect(screen.getByText('Great effort this week.')).toBeInTheDocument()
  })

  it('marks an edited comment', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'c1',
          sadhanaReportId: 'r1',
          mentorId: 'mentor-1',
          mentorName: 'Mentor One',
          commentText: 'Edited note',
          createdAt: '2026-01-15T10:00:00.000Z',
          updatedAt: '2026-01-16T10:00:00.000Z',
        },
      ],
    })

    render(<SadhanaReportComments sadhanaReportId="r1" />)

    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument()
  })

  it('renders no interactive control at all — fully read-only', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'c1',
          sadhanaReportId: 'r1',
          mentorId: 'mentor-1',
          mentorName: 'Mentor One',
          commentText: 'Note',
          createdAt: '2026-01-15T10:00:00.000Z',
          updatedAt: '2026-01-15T10:00:00.000Z',
        },
      ],
    })

    render(<SadhanaReportComments sadhanaReportId="r1" />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })
})
