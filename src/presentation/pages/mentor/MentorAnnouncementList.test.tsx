import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Announcement } from '@sadhana-connect/domain'
import { MentorAnnouncementList } from '@/presentation/pages/mentor/MentorAnnouncementList'

function renderList(announcements: Announcement[]) {
  return render(
    <MemoryRouter>
      <MentorAnnouncementList announcements={announcements} />
    </MemoryRouter>,
  )
}

const { useAuthMock, useUpdateAnnouncementMock, useDeleteAnnouncementMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useUpdateAnnouncementMock: vi.fn(),
  useDeleteAnnouncementMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('@sadhana-connect/announcements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/announcements')>()
  return {
    ...actual,
    useUpdateAnnouncement: useUpdateAnnouncementMock,
    useDeleteAnnouncement: useDeleteAnnouncementMock,
  }
})

const ownAnnouncement: Announcement = {
  id: 'a1',
  authorId: 'mentor-1',
  title: 'My Notice',
  content: 'Body text',
  scope: 'temple_group',
  templeGroupId: 'group-1',
  isPublished: true,
  publishedAt: '2026-01-15T00:00:00.000Z',
  expiresAt: null,
  isPinned: false,
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
  expiresAt: null,
  isPinned: false,
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
    renderList([ownAnnouncement, otherAnnouncement])

    expect(screen.getByText('My Notice')).toBeInTheDocument()
    expect(screen.getByText('Body text')).toBeInTheDocument()
    expect(screen.getByText('Other Notice')).toBeInTheDocument()
  })

  it('shows Edit/Delete only for the current mentor\'s own announcement', () => {
    renderList([ownAnnouncement, otherAnnouncement])

    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('marks an unpublished own announcement as a Draft', () => {
    renderList([draftAnnouncement])

    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('requires delete confirmation before calling the mutation', async () => {
    const mutate = vi.fn()
    useDeleteAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    renderList([ownAnnouncement])

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(mutate).not.toHaveBeenCalled()
    expect(
      screen.getByText('Deleting removes this announcement for devotees. This cannot be undone.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm delete' }))
    expect(mutate).toHaveBeenCalledWith('a1')
  })

  it('edit switches to editable fields and saves the validated values', async () => {
    const mutate = vi.fn((_input, options) => options?.onSuccess?.())
    useUpdateAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    renderList([ownAnnouncement])

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const titleInput = screen.getByLabelText('Edit title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Notice')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mutate).toHaveBeenCalledWith(
      {
        id: 'a1',
        title: 'Updated Notice',
        content: 'Body text',
        isPublished: true,
        expiresAt: null,
        isPinned: false,
      },
      expect.anything(),
    )
  })

  it('shows "Permanent" for a null expiresAt and "Expires <date>" for a set one', () => {
    const expiring: Announcement = { ...ownAnnouncement, id: 'a4', expiresAt: '2026-02-01T00:00:00.000Z' }
    renderList([ownAnnouncement, expiring])

    expect(screen.getByText('Permanent')).toBeInTheDocument()
    expect(screen.getByText(/Expires/)).toBeInTheDocument()
  })

  it('Pin/Unpin toggles isPinned while leaving every other field unchanged', async () => {
    const mutate = vi.fn()
    useUpdateAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    renderList([ownAnnouncement])

    expect(screen.queryByText('Pinned')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pin' }))

    expect(mutate).toHaveBeenCalledWith({
      id: 'a1',
      title: 'My Notice',
      content: 'Body text',
      isPublished: true,
      expiresAt: null,
      isPinned: true,
    })
  })

  it('renders a "Pinned" badge and an Unpin button for an already-pinned announcement', () => {
    const pinned: Announcement = { ...ownAnnouncement, isPinned: true }
    renderList([pinned])

    expect(screen.getByText('Pinned')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unpin' })).toBeInTheDocument()
  })

  it('links every announcement (own or not) to its comment thread at /announcements/:id', () => {
    renderList([ownAnnouncement, otherAnnouncement])

    const links = screen.getAllByRole('link', { name: 'View comments' })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/announcements/a1')
    expect(links[1]).toHaveAttribute('href', '/announcements/a2')
  })
})
