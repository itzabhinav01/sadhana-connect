import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SadhanaReportComment } from '@sadhana-connect/domain/entities/sadhana-report-comment'
import { MentorCommentList } from '@/presentation/pages/mentor/MentorCommentList'

const { useAuthMock, useUpdateCommentMock, useDeleteCommentMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useUpdateCommentMock: vi.fn(),
  useDeleteCommentMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/application/comments/use-update-comment', () => ({
  useUpdateComment: useUpdateCommentMock,
}))
vi.mock('@/application/comments/use-delete-comment', () => ({
  useDeleteComment: useDeleteCommentMock,
}))

const ownComment: SadhanaReportComment = {
  id: 'c1',
  sadhanaReportId: 'r1',
  mentorId: 'mentor-1',
  mentorName: 'Mentor One',
  commentText: 'Great progress!',
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
}

const otherMentorComment: SadhanaReportComment = {
  id: 'c2',
  sadhanaReportId: 'r1',
  mentorId: 'mentor-2',
  mentorName: 'Former Mentor',
  commentText: 'Keep it up.',
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
}

describe('MentorCommentList', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useUpdateCommentMock.mockReset()
    useDeleteCommentMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useUpdateCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useDeleteCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('shows an empty state when there are no comments', () => {
    render(<MentorCommentList comments={[]} sadhanaReportId="r1" />)
    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
  })

  it('renders each comment with its mentor name and text', () => {
    render(<MentorCommentList comments={[ownComment, otherMentorComment]} sadhanaReportId="r1" />)

    expect(screen.getByText('Mentor One')).toBeInTheDocument()
    expect(screen.getByText('Great progress!')).toBeInTheDocument()
    expect(screen.getByText('Former Mentor')).toBeInTheDocument()
    expect(screen.getByText('Keep it up.')).toBeInTheDocument()
  })

  it('shows Edit/Delete only for the current mentor\'s own comment', () => {
    render(<MentorCommentList comments={[ownComment, otherMentorComment]} sadhanaReportId="r1" />)

    // Exactly one Edit and one Delete button exist (for the own comment only).
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('shows an "(edited)" marker when updatedAt differs from createdAt', () => {
    render(
      <MentorCommentList
        comments={[{ ...ownComment, updatedAt: '2026-01-16T10:00:00.000Z' }]}
        sadhanaReportId="r1"
      />,
    )

    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument()
  })

  it('requires delete confirmation before calling the mutation', async () => {
    const mutate = vi.fn()
    useDeleteCommentMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    render(<MentorCommentList comments={[ownComment]} sadhanaReportId="r1" />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText('Delete this comment?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mutate).toHaveBeenCalledWith('c1')
  })

  it('cancelling delete leaves the comment untouched', async () => {
    const mutate = vi.fn()
    useDeleteCommentMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    render(<MentorCommentList comments={[ownComment]} sadhanaReportId="r1" />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('edit switches to a textarea and saves the validated text', async () => {
    const mutate = vi.fn((_input, options) => options?.onSuccess?.())
    useUpdateCommentMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    render(<MentorCommentList comments={[ownComment]} sadhanaReportId="r1" />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const textarea = screen.getByLabelText('Edit comment')
    await user.clear(textarea)
    await user.type(textarea, 'Updated note')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mutate).toHaveBeenCalledWith(
      { commentId: 'c1', commentText: 'Updated note' },
      expect.anything(),
    )
  })

  it('edit rejects an empty comment without calling the mutation', async () => {
    const mutate = vi.fn()
    useUpdateCommentMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    render(<MentorCommentList comments={[ownComment]} sadhanaReportId="r1" />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const textarea = screen.getByLabelText('Edit comment')
    await user.clear(textarea)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mutate).not.toHaveBeenCalled()
  })
})
