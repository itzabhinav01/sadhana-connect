import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementsFeedPage } from '@/presentation/pages/announcements/AnnouncementsFeedPage'

const { useAnnouncementsMock } = vi.hoisted(() => ({
  useAnnouncementsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/announcements', () => ({
  useAnnouncements: useAnnouncementsMock,
}))

function renderFeed() {
  return render(
    <MemoryRouter>
      <AnnouncementsFeedPage />
    </MemoryRouter>,
  )
}

const pinned = {
  id: 'a1',
  authorId: 'mentor-1',
  title: 'Pinned Notice',
  content: 'This is pinned.',
  scope: 'all' as const,
  templeGroupId: null,
  isPublished: true,
  publishedAt: '2026-01-10T00:00:00.000Z',
  expiresAt: null,
  isPinned: true,
  createdAt: '2026-01-10T00:00:00.000Z',
  updatedAt: '2026-01-10T00:00:00.000Z',
}

const unpinned = {
  ...pinned,
  id: 'a2',
  title: 'Unpinned Notice',
  content: 'This is not pinned.',
  publishedAt: '2026-01-20T00:00:00.000Z',
  isPinned: false,
}

describe('AnnouncementsFeedPage', () => {
  beforeEach(() => {
    useAnnouncementsMock.mockReset()
  })

  it('shows a loading state', () => {
    useAnnouncementsMock.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined })

    renderFeed()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useAnnouncementsMock.mockReturnValue({ isPending: false, isError: true, isSuccess: false, data: undefined })

    renderFeed()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows an empty state', () => {
    useAnnouncementsMock.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })

    renderFeed()

    expect(screen.getByText('No announcements yet.')).toBeInTheDocument()
  })

  it('renders every announcement in the order the repository returned (trusts DB ordering, no client re-sort)', () => {
    // Deliberately passed unpinned-first to prove the component does not
    // re-sort — announcements_feed_ordering_idx (0011) + the repository's
    // own .order() calls are the actual ordering authority.
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [unpinned, pinned],
    })

    renderFeed()

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Unpinned Notice', 'Pinned Notice'])
  })

  it('shows a Pinned badge only on a pinned announcement', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [pinned, unpinned],
    })

    renderFeed()

    expect(screen.getAllByText('Pinned')).toHaveLength(1)
  })

  it('links each card to its detail page', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [pinned],
    })

    renderFeed()

    expect(screen.getByRole('link', { name: /Pinned Notice/ })).toHaveAttribute(
      'href',
      '/announcements/a1',
    )
  })
})
