import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MentorReportCommentSection } from '@/presentation/pages/mentor/MentorReportCommentSection'

const { useSadhanaReportCommentsMock, useAuthMock, useAddCommentMock } = vi.hoisted(() => ({
  useSadhanaReportCommentsMock: vi.fn(),
  useAuthMock: vi.fn(),
  useAddCommentMock: vi.fn(),
}))

vi.mock('@/application/comments/use-sadhana-report-comments', () => ({
  useSadhanaReportComments: useSadhanaReportCommentsMock,
}))
vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/application/comments/use-add-comment', () => ({
  useAddComment: useAddCommentMock,
}))

describe('MentorReportCommentSection', () => {
  beforeEach(() => {
    useSadhanaReportCommentsMock.mockReset()
    useAuthMock.mockReset()
    useAddCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useAddCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  })

  it('shows a loading state while comments are pending', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    render(<MentorReportCommentSection sadhanaReportId="r1" />)

    expect(screen.getByText(/loading comments/i)).toBeInTheDocument()
  })

  it('shows an error state on failure', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    render(<MentorReportCommentSection sadhanaReportId="r1" />)

    expect(screen.getByText(/something went wrong loading comments/i)).toBeInTheDocument()
  })

  it('renders the comment list and the add-comment form together', () => {
    useSadhanaReportCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    render(<MentorReportCommentSection sadhanaReportId="r1" />)

    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
    expect(screen.getByLabelText('Add a comment')).toBeInTheDocument()
  })
})
