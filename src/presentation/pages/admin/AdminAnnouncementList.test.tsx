import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Announcement } from '@sadhana-connect/domain'
import { AdminAnnouncementList } from '@/presentation/pages/admin/AdminAnnouncementList'

function renderList(announcements: Announcement[]) {
  return render(
    <MemoryRouter>
      <AdminAnnouncementList announcements={announcements} />
    </MemoryRouter>,
  )
}

const { useUpdateAnnouncementMock, useDeleteAnnouncementMock } = vi.hoisted(() => ({
  useUpdateAnnouncementMock: vi.fn(),
  useDeleteAnnouncementMock: vi.fn(),
}))

vi.mock('@sadhana-connect/announcements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/announcements')>()
  return {
    ...actual,
    useUpdateAnnouncement: useUpdateAnnouncementMock,
    useDeleteAnnouncement: useDeleteAnnouncementMock,
  }
})

const publishedAnnouncement: Announcement = {
  id: 'a1',
  authorId: 'admin-1',
  title: 'Notice',
  content: 'Body',
  scope: 'all',
  templeGroupId: null,
  isPublished: true,
  publishedAt: '2026-01-15T00:00:00.000Z',
  expiresAt: null,
  isPinned: false,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('AdminAnnouncementList — publish/unpublish toggle', () => {
  beforeEach(() => {
    useUpdateAnnouncementMock.mockReset()
    useDeleteAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('shows "Unpublish" for a published announcement and flips isPublished to false on click', async () => {
    const mutate = vi.fn()
    useUpdateAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    renderList([publishedAnnouncement])
    await user.click(screen.getByRole('button', { name: /unpublish/i }))

    expect(mutate).toHaveBeenCalledWith({
      id: 'a1',
      title: 'Notice',
      content: 'Body',
      isPublished: false,
      expiresAt: null,
      isPinned: false,
    })
  })

  it('shows "Publish" for a draft announcement and flips isPublished to true on click', async () => {
    const mutate = vi.fn()
    useUpdateAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()
    const draft: Announcement = { ...publishedAnnouncement, isPublished: false, publishedAt: null }

    renderList([draft])
    await user.click(screen.getByRole('button', { name: /^publish$/i }))

    expect(mutate).toHaveBeenCalledWith({
      id: 'a1',
      title: 'Notice',
      content: 'Body',
      isPublished: true,
      expiresAt: null,
      isPinned: false,
    })
  })
})

describe('AdminAnnouncementList — pin toggle and delete confirmation', () => {
  beforeEach(() => {
    useUpdateAnnouncementMock.mockReset()
    useDeleteAnnouncementMock.mockReset()
  })

  it('shows "Pin" for an unpinned announcement and flips isPinned to true on click', async () => {
    const mutate = vi.fn()
    useUpdateAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    useDeleteAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    const user = userEvent.setup()

    renderList([publishedAnnouncement])
    await user.click(screen.getByRole('button', { name: 'Pin' }))

    expect(mutate).toHaveBeenCalledWith({
      id: 'a1',
      title: 'Notice',
      content: 'Body',
      isPublished: true,
      expiresAt: null,
      isPinned: true,
    })
  })

  it('requires typed confirmation copy before calling delete, mentioning devotee visibility', async () => {
    const mutate = vi.fn()
    useUpdateAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useDeleteAnnouncementMock.mockReturnValue({ mutate, isPending: false })
    const user = userEvent.setup()

    renderList([publishedAnnouncement])
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(mutate).not.toHaveBeenCalled()
    expect(
      screen.getByText('Deleting removes this announcement for devotees. This cannot be undone.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm delete' }))
    expect(mutate).toHaveBeenCalledWith('a1')
  })

  it('links the announcement to its comment thread at /announcements/:id', () => {
    useUpdateAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useDeleteAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false })

    renderList([publishedAnnouncement])

    expect(screen.getByRole('link', { name: 'View comments' })).toHaveAttribute(
      'href',
      '/announcements/a1',
    )
  })
})
