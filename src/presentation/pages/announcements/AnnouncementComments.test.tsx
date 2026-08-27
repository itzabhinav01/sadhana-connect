import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementComments } from '@/presentation/pages/announcements/AnnouncementComments'

const {
  useAuthMock,
  useProfileMock,
  useAnnouncementCommentsMock,
  useCreateAnnouncementCommentMock,
  useUpdateAnnouncementCommentMock,
  useDeleteAnnouncementCommentMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useProfileMock: vi.fn(),
  useAnnouncementCommentsMock: vi.fn(),
  useCreateAnnouncementCommentMock: vi.fn(),
  useUpdateAnnouncementCommentMock: vi.fn(),
  useDeleteAnnouncementCommentMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({ useAuth: useAuthMock, useProfile: useProfileMock }))
vi.mock('@sadhana-connect/announcements', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sadhana-connect/announcements')>()),
  useAnnouncementComments: useAnnouncementCommentsMock,
  useCreateAnnouncementComment: useCreateAnnouncementCommentMock,
  useUpdateAnnouncementComment: useUpdateAnnouncementCommentMock,
  useDeleteAnnouncementComment: useDeleteAnnouncementCommentMock,
}))

const ownComment = {
  id: 'c1',
  announcementId: 'a1',
  authorId: 'devotee-1',
  authorName: 'Devotee One',
  commentText: 'My own question',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

const otherComment = {
  id: 'c2',
  announcementId: 'a1',
  authorId: 'devotee-2',
  authorName: 'Devotee Two',
  commentText: "Someone else's question",
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('AnnouncementComments', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useProfileMock.mockReset()
    useAnnouncementCommentsMock.mockReset()
    useCreateAnnouncementCommentMock.mockReset()
    useUpdateAnnouncementCommentMock.mockReset()
    useDeleteAnnouncementCommentMock.mockReset()

    useAuthMock.mockReturnValue({
      session: { userId: 'devotee-1', email: 'd@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      data: { id: 'devotee-1', fullName: 'Devotee One', role: 'devotee', templeGroupId: null, isActive: true },
    })
    useCreateAnnouncementCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
    useUpdateAnnouncementCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useDeleteAnnouncementCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('shows an empty state with no comments', () => {
    useAnnouncementCommentsMock.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })

    render(<AnnouncementComments announcementId="a1" announcementAuthorId="mentor-9" />)

    expect(screen.getByText('No questions yet.')).toBeInTheDocument()
  })

  it('rejects an empty comment without calling the mutation', async () => {
    useAnnouncementCommentsMock.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })
    const mutate = vi.fn()
    useCreateAnnouncementCommentMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<AnnouncementComments announcementId="a1" announcementAuthorId="mentor-9" />)
    await user.click(screen.getByRole('button', { name: 'Post' }))

    expect(mutate).not.toHaveBeenCalled()
  })

  it('posts a genuine question and resets the composer', async () => {
    useAnnouncementCommentsMock.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })
    const mutate = vi.fn((_text, options) => options?.onSuccess?.())
    useCreateAnnouncementCommentMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<AnnouncementComments announcementId="a1" announcementAuthorId="mentor-9" />)
    await user.type(screen.getByLabelText(/ask a question/i), 'When does this start?')
    await user.click(screen.getByRole('button', { name: 'Post' }))

    expect(mutate).toHaveBeenCalledWith('When does this start?', expect.anything())
  })

  it('shows Edit/Delete only for the viewer\'s own comment when not moderating', () => {
    useAnnouncementCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownComment, otherComment],
    })

    render(<AnnouncementComments announcementId="a1" announcementAuthorId="mentor-9" />)

    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('editing own comment saves the validated text', async () => {
    useAnnouncementCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownComment],
    })
    const mutate = vi.fn((_input, options) => options?.onSuccess?.())
    useUpdateAnnouncementCommentMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    render(<AnnouncementComments announcementId="a1" announcementAuthorId="mentor-9" />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const textbox = screen.getByLabelText('Edit comment')
    await user.clear(textbox)
    await user.type(textbox, 'Updated question')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mutate).toHaveBeenCalledWith(
      { commentId: 'c1', commentText: 'Updated question' },
      expect.anything(),
    )
  })

  it('the announcement author sees a Delete (moderation) control on a comment that is not their own', () => {
    useAnnouncementCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [otherComment],
    })

    // Viewer (devotee-1) authored the announcement itself.
    render(<AnnouncementComments announcementId="a1" announcementAuthorId="devotee-1" />)

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('a super admin sees a Delete (moderation) control on any comment', () => {
    useProfileMock.mockReturnValue({
      data: { id: 'admin-1', fullName: 'Admin', role: 'super_admin', templeGroupId: null, isActive: true },
    })
    useAuthMock.mockReturnValue({
      session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useAnnouncementCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [otherComment],
    })

    render(<AnnouncementComments announcementId="a1" announcementAuthorId="mentor-9" />)

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('a viewer with no relation to the comment or announcement sees neither Edit nor Delete', () => {
    useAnnouncementCommentsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [otherComment],
    })

    render(<AnnouncementComments announcementId="a1" announcementAuthorId="mentor-9" />)

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})
