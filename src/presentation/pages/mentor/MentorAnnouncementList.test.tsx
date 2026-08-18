import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Announcement } from '@/domain/entities/announcement'
import { MentorAnnouncementList } from '@/presentation/pages/mentor/MentorAnnouncementList'

const { useAuthMock, useUpdateAnnouncementMock, useDeleteAnnouncementMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useUpdateAnnouncementMock: vi.fn(),
  useDeleteAnnouncementMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@/application/announcements/use-update-announcement', () => ({
  useUpdateAnnouncement: useUpdateAnnouncementMock,
}))
vi.mock('@/application/announcements/use-delete-announcement', () => ({
  useDeleteAnnouncement: useDeleteAnnouncementMock,
}))

const ownAnnouncement: Announcement = {
  id: 'a1',
  authorId: 'mentor-1',
  title: 'My Notice',
  content: 'Body text',
  scope: 'temple_group',
  templeGroupId: 'group-1',
  isPublished: true,
  publishedAt: '2026-01-15T00:00:00.000Z',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

const otherAnnouncement: Announcement = {
  id: 'a2',
  authorId: 'mentor-2',
  title: 'Other Notice',
  content: 'Other body',
  scope: 'temple_group',
  templeGroupId: 'group-1',
  isPublished: true,
  publishedAt: '2026-01-10T00:00:00.000Z',
  createdAt: '2026-01-10T00:00:00.000Z',
  updatedAt: '2026-01-10T00:00:00.000Z',
}

const draftAnnouncement: Announcement = {
  ...ownAnnouncement,
  id: 'a3',
  title: 'Draft Notice',
  isPublished: false,
  publishedAt: null,
}

describe('MentorAnnouncementList', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    useUpdateAnnouncementMock.mockReset()
    useDeleteAnnouncementMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useUpdateAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useDeleteAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('renders each announcement title and content', () => {
    render(<MentorAnnouncementList announcements={[ownAnnouncement, otherAnnouncement]} />)

    expect(screen.getByText('My Notice')).toBeInTheDocument()
    expect(screen.getByText('Body text')).toBeInTheDocument()
    expect(screen.getByText('Other Notice')).toBeInTheDocument()
  })

  it('shows Edit/Delete only for the current mentor\'s own announcement', () => {
    render(<MentorAnnouncementList announcements={[ownAnnouncement, otherAnnouncement]} />)

    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('marks an unpublished own announcement as a Draft', () => {
    render(<MentorAnnouncementList announcements={[draftAnnouncement]} />)

    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('requires delete confirmation before calling the mutation', async () => {
    const mutate = vi.fn()
    useDeleteAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    render(<MentorAnnouncementList announcements={[ownAnnouncement]} />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(mutate).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mutate).toHaveBeenCalledWith('a1')
  })

  it('edit switches to editable fields and saves the validated values', async () => {
    const mutate = vi.fn((_input, options) => options?.onSuccess?.())
    useUpdateAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    render(<MentorAnnouncementList announcements={[ownAnnouncement]} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const titleInput = screen.getByLabelText('Edit title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Notice')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mutate).toHaveBeenCalledWith(
      { id: 'a1', title: 'Updated Notice', content: 'Body text', isPublished: true },
      expect.anything(),
    )
  })
})
